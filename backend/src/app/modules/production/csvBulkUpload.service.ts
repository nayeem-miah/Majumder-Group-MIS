import fs from 'fs';
import httpStatus from 'http-status';
import { pool } from '../../db';
import ApiError from '../../errors/apiError';

export interface CsvRowError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedCsvRow {
  rowNum: number;
  prod_date: string;
  floor_no: number;
  line_no: number;
  style_no: string;
  operators_present: number;
  working_minutes: number;
  output_qty: number;
  defect_qty: number;
}

/**
 * Parses raw CSV string safely supporting headers and quoted values
 */
export const parseCsvContent = (content: string): { headers: string[]; rows: Record<string, string>[] } => {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const rowObj: Record<string, string> = {};
    rawHeaders.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : '';
    });
    rows.push(rowObj);
  }

  return { headers: rawHeaders, rows };
};

/**
 * Executes an atomic bulk upload of production records.
 * Uses a single checked-out client with BEGIN ... COMMIT / ROLLBACK.
 * Locks affected styles in consistent order to prevent deadlocks and race conditions.
 */
const bulkUploadProduction = async (filePath: string) => {
  const errors: CsvRowError[] = [];

  let fileContent: string;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Unable to read uploaded file: ${err.message}`);
  } finally {
    // Clean up temporary uploaded file safely
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_) {}
  }

  if (!fileContent.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Uploaded CSV file is empty');
  }

  const { headers, rows } = parseCsvContent(fileContent);

  const expectedHeaders = [
    'prod_date',
    'floor_no',
    'line_no',
    'style_no',
    'operators_present',
    'working_minutes',
    'output_qty',
    'defect_qty',
  ];

  const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Missing required CSV headers: ${missingHeaders.join(', ')}`
    );
  }

  if (rows.length === 0) {
    const errRes: any = new ApiError(
      httpStatus.BAD_REQUEST,
      'The CSV has a header row but no data rows. Add at least one production row under the header (or download the template, which already includes a sample row), then upload again.'
    );
    errRes.errors = [
      {
        row: 2,
        field: 'file',
        message: 'No data rows found after the header row.',
      },
    ];
    throw errRes;
  }

  const parsedRows: ParsedCsvRow[] = [];

  // 1. Syntactic Row-by-Row Validation
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNum = idx + 2; // CSV 1-indexed, line 1 is header

    // Date
    if (!row.prod_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.prod_date)) {
      errors.push({
        row: rowNum,
        field: 'prod_date',
        message: 'Invalid date format (must be YYYY-MM-DD)',
      });
    }

    // Floor
    const floorNo = parseInt(row.floor_no, 10);
    if (isNaN(floorNo) || floorNo <= 0) {
      errors.push({
        row: rowNum,
        field: 'floor_no',
        message: 'Floor number must be a positive integer',
      });
    }

    // Line
    const lineNo = parseInt(row.line_no, 10);
    if (isNaN(lineNo) || lineNo <= 0) {
      errors.push({
        row: rowNum,
        field: 'line_no',
        message: 'Line number must be a positive integer',
      });
    }

    // Style No
    if (!row.style_no || row.style_no.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'style_no',
        message: 'Style number is required',
      });
    }

    // Operators
    const operators = parseInt(row.operators_present, 10);
    if (isNaN(operators) || operators <= 0) {
      errors.push({
        row: rowNum,
        field: 'operators_present',
        message: 'Operators present must be greater than zero',
      });
    }

    // Working Minutes
    const minutes = parseInt(row.working_minutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      errors.push({
        row: rowNum,
        field: 'working_minutes',
        message: 'Working minutes must be greater than zero',
      });
    }

    // Output Qty
    const outputQty = parseInt(row.output_qty, 10);
    if (isNaN(outputQty) || outputQty < 0) {
      errors.push({
        row: rowNum,
        field: 'output_qty',
        message: 'Output quantity cannot be negative',
      });
    }

    // Defect Qty
    const defectQty = parseInt(row.defect_qty, 10);
    if (isNaN(defectQty) || defectQty < 0) {
      errors.push({
        row: rowNum,
        field: 'defect_qty',
        message: 'Defect quantity cannot be negative',
      });
    } else if (!isNaN(outputQty) && defectQty > outputQty) {
      errors.push({
        row: rowNum,
        field: 'defect_qty',
        message: 'Defect quantity cannot exceed output quantity',
      });
    }

    if (errors.length === 0 || !errors.some((e) => e.row === rowNum)) {
      parsedRows.push({
        rowNum,
        prod_date: row.prod_date,
        floor_no: floorNo,
        line_no: lineNo,
        style_no: row.style_no.trim(),
        operators_present: operators,
        working_minutes: minutes,
        output_qty: outputQty,
        defect_qty: defectQty,
      });
    }
  }

  // If syntactic errors exist, fail immediately before touching database
  if (errors.length > 0) {
    const errorResponse: any = new ApiError(
      httpStatus.BAD_REQUEST,
      'CSV upload failed. All records have been rolled back.'
    );
    errorResponse.errors = errors;
    throw errorResponse;
  }

  // 2. Atomic Database Transaction with FOR UPDATE Locking
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Collect all distinct style numbers in sorted order to avoid deadlocks
    const uniqueStyleNos = Array.from(new Set(parsedRows.map((r) => r.style_no))).sort();

    // Query and lock all referenced styles in the database
    const stylesRes = await client.query(
      `SELECT style_id, style_no, smv, order_qty
       FROM styles
       WHERE style_no = ANY($1)
       FOR UPDATE`,
      [uniqueStyleNos]
    );

    const styleMap = new Map<string, { style_id: string; style_no: string; smv: number; order_qty: number }>();
    stylesRes.rows.forEach((s) => {
      styleMap.set(s.style_no, {
        style_id: s.style_id,
        style_no: s.style_no,
        smv: parseFloat(s.smv),
        order_qty: parseInt(s.order_qty, 10),
      });
    });

    // Verify all styles exist
    for (const r of parsedRows) {
      if (!styleMap.has(r.style_no)) {
        errors.push({
          row: r.rowNum,
          field: 'style_no',
          message: `Style number ${r.style_no} does not exist`,
        });
      }
    }

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      const errRes: any = new ApiError(
        httpStatus.BAD_REQUEST,
        'CSV upload failed. All records have been rolled back.'
      );
      errRes.errors = errors;
      throw errRes;
    }

    // Query existing cumulative production totals for each style
    const styleIds = Array.from(styleMap.values()).map((s) => s.style_id);
    const existingCumRes = await client.query(
      `SELECT style_id, COALESCE(SUM(output_qty), 0)::INT as total_produced
       FROM line_production
       WHERE style_id = ANY($1)
       GROUP BY style_id`,
      [styleIds]
    );

    const cumProducedMap = new Map<string, number>();
    existingCumRes.rows.forEach((row) => {
      cumProducedMap.set(row.style_id.toString(), parseInt(row.total_produced, 10));
    });

    // Track running totals including current batch
    const batchProducedMap = new Map<string, number>();

    for (const r of parsedRows) {
      const style = styleMap.get(r.style_no)!;
      const initialTotal = cumProducedMap.get(style.style_id.toString()) || 0;
      const currentBatchTotal = batchProducedMap.get(style.style_id.toString()) || 0;
      const newTotal = initialTotal + currentBatchTotal + r.output_qty;

      if (newTotal > style.order_qty) {
        errors.push({
          row: r.rowNum,
          field: 'output_qty',
          message: `Cumulative output for style ${r.style_no} (${newTotal}) exceeds order quantity (${style.order_qty})`,
        });
      } else {
        batchProducedMap.set(style.style_id.toString(), currentBatchTotal + r.output_qty);
      }
    }

    // If cumulative limits exceeded, rollback
    if (errors.length > 0) {
      await client.query('ROLLBACK');
      const errRes: any = new ApiError(
        httpStatus.BAD_REQUEST,
        'CSV upload failed. All records have been rolled back.'
      );
      errRes.errors = errors;
      throw errRes;
    }

    // 3. Insert all records inside the transaction
    for (const r of parsedRows) {
      const style = styleMap.get(r.style_no)!;
      await client.query(
        `INSERT INTO line_production (
          prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          r.prod_date,
          r.floor_no,
          r.line_no,
          style.style_id,
          r.operators_present,
          r.working_minutes,
          r.output_qty,
          r.defect_qty,
        ]
      );
    }

    await client.query('COMMIT');

    return {
      totalRows: parsedRows.length,
      insertedRows: parsedRows.length,
      failedRows: 0,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

export const CsvBulkUploadService = {
  bulkUploadProduction,
  parseCsvContent,
};

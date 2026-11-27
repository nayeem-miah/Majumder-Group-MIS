import httpStatus from 'http-status';
import { pool, query } from '../../db';
import ApiError from '../../errors/apiError';

export interface ProductionPayload {
  prod_date: string;
  floor_no: number;
  line_no: number;
  style_id: string | number;
  operators_present: number;
  working_minutes: number;
  output_qty: number;
  defect_qty: number;
}

/**
 * Calculates industrial MajumderGroup efficiency dynamically:
 * Efficiency % = ((Output Qty × SMV) / (Operators Present × Working Minutes)) × 100
 */
export const calculateEfficiency = (
  outputQty: number,
  smv: number,
  operators: number,
  minutes: number,
): number => {
  const availableMinutes = operators * minutes;
  if (availableMinutes <= 0) return 0;
  const earnedMinutes = outputQty * smv;
  const eff = (earnedMinutes / availableMinutes) * 100;
  return Math.round(eff * 100) / 100;
};

/**
 * Calculates industrial DHU (Defects per Hundred Units) dynamically:
 * DHU % = (Defect Qty / Output Qty) × 100
 */
export const calculateDHU = (defectQty: number, outputQty: number): number => {
  if (outputQty <= 0) return 0;
  const dhu = (defectQty / outputQty) * 100;
  return Math.round(dhu * 100) / 100;
};

const createProduction = async (payload: ProductionPayload) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock the relevant style row using SELECT ... FOR UPDATE to prevent race conditions
    const styleRes = await client.query(
      'SELECT style_id, style_no, buyer_name, smv, order_qty FROM styles WHERE style_id = $1 FOR UPDATE',
      [payload.style_id],
    );

    if (styleRes.rows.length === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Style ID '${payload.style_id}' does not exist`,
      );
    }

    const style = styleRes.rows[0];
    const orderQty = parseInt(style.order_qty, 10);
    const smv = parseFloat(style.smv);

    // 2. Check cumulative output across ALL production lines
    const cumRes = await client.query(
      'SELECT COALESCE(SUM(output_qty), 0)::INT as total_produced FROM line_production WHERE style_id = $1',
      [payload.style_id],
    );
    const alreadyProduced = parseInt(cumRes.rows[0].total_produced, 10);
    const remainingQuantity = orderQty - alreadyProduced;

    // 3. Reject if new production entry exceeds remaining order quantity
    if (alreadyProduced + payload.output_qty > orderQty) {
      const err: any = new ApiError(
        httpStatus.BAD_REQUEST,
        'Production quantity exceeds the remaining order quantity',
      );
      err.data = {
        orderQuantity: orderQty,
        alreadyProduced,
        remainingQuantity: Math.max(0, remainingQuantity),
        requestedQuantity: payload.output_qty,
      };
      throw err;
    }

    // 4. Insert production entry using raw SQL
    const insertRes = await client.query(
      `INSERT INTO line_production (
        prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING prod_id, prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty, created_at, updated_at`,
      [
        payload.prod_date,
        payload.floor_no,
        payload.line_no,
        payload.style_id,
        payload.operators_present,
        payload.working_minutes,
        payload.output_qty,
        payload.defect_qty,
      ],
    );

    await client.query('COMMIT');

    const row = insertRes.rows[0];
    const efficiency = calculateEfficiency(
      row.output_qty,
      smv,
      row.operators_present,
      row.working_minutes,
    );
    const dhu = calculateDHU(row.defect_qty, row.output_qty);

    return {
      ...row,
      style: {
        style_id: style.style_id,
        style_no: style.style_no,
        buyer_name: style.buyer_name,
        smv,
        order_qty: orderQty,
      },
      efficiency,
      dhu,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllProduction = async (queryParams: Record<string, any>) => {
  const {
    prod_date,
    floor_no,
    line_no,
    style_id,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryParams;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (prod_date) {
    conditions.push(`lp.prod_date = $${paramIndex}`);
    values.push(prod_date);
    paramIndex++;
  }

  if (startDate) {
    conditions.push(`lp.prod_date >= $${paramIndex}`);
    values.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`lp.prod_date <= $${paramIndex}`);
    values.push(endDate);
    paramIndex++;
  }

  if (floor_no) {
    conditions.push(`lp.floor_no = $${paramIndex}`);
    values.push(floor_no);
    paramIndex++;
  }

  if (line_no) {
    conditions.push(`lp.line_no = $${paramIndex}`);
    values.push(line_no);
    paramIndex++;
  }

  if (style_id) {
    conditions.push(`lp.style_id = $${paramIndex}`);
    values.push(style_id);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortCols: Record<string, string> = {
    prod_id: 'lp.prod_id',
    prod_date: 'lp.prod_date',
    floor_no: 'lp.floor_no',
    line_no: 'lp.line_no',
    output_qty: 'lp.output_qty',
    defect_qty: 'lp.defect_qty',
    created_at: 'lp.created_at',
  };
  const sortCol = allowedSortCols[sortBy] || 'lp.created_at';
  const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) as total FROM line_production lp ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  const dataQuery = `
    SELECT
      lp.prod_id,
      lp.prod_date,
      lp.floor_no,
      lp.line_no,
      lp.style_id,
      s.style_no,
      s.buyer_name,
      s.smv,
      s.order_qty,
      lp.operators_present,
      lp.working_minutes,
      lp.output_qty,
      lp.defect_qty,
      lp.created_at,
      lp.updated_at
    FROM line_production lp
    JOIN styles s ON lp.style_id = s.style_id
    ${whereClause}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataResult = await query(dataQuery, [...values, limitNum, offset]);

  // Compute dynamic efficiency and DHU for each row
  const rows = dataResult.rows.map((row) => {
    const smv = parseFloat(row.smv);
    const eff = calculateEfficiency(
      row.output_qty,
      smv,
      row.operators_present,
      row.working_minutes,
    );
    const dhu = calculateDHU(row.defect_qty, row.output_qty);
    return {
      prod_id: row.prod_id,
      prod_date: row.prod_date,
      floor_no: row.floor_no,
      line_no: row.line_no,
      style_id: row.style_id,
      style_no: row.style_no,
      buyer_name: row.buyer_name,
      smv,
      order_qty: row.order_qty,
      operators_present: row.operators_present,
      working_minutes: row.working_minutes,
      output_qty: row.output_qty,
      defect_qty: row.defect_qty,
      efficiency: eff,
      dhu,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage: Math.ceil(total / limitNum),
    },
    data: rows,
  };
};

const getProductionById = async (prodId: string | number) => {
  const result = await query(
    `SELECT
      lp.prod_id,
      lp.prod_date,
      lp.floor_no,
      lp.line_no,
      lp.style_id,
      s.style_no,
      s.buyer_name,
      s.smv,
      s.order_qty,
      lp.operators_present,
      lp.working_minutes,
      lp.output_qty,
      lp.defect_qty,
      lp.created_at,
      lp.updated_at
    FROM line_production lp
    JOIN styles s ON lp.style_id = s.style_id
    WHERE lp.prod_id = $1`,
    [prodId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Production record not found');
  }

  const row = result.rows[0];
  const smv = parseFloat(row.smv);
  const eff = calculateEfficiency(
    row.output_qty,
    smv,
    row.operators_present,
    row.working_minutes,
  );
  const dhu = calculateDHU(row.defect_qty, row.output_qty);

  return {
    ...row,
    smv,
    efficiency: eff,
    dhu,
  };
};

const updateProduction = async (
  prodId: string | number,
  payload: Partial<ProductionPayload>,
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current production record with lock
    const prodRes = await client.query(
      'SELECT prod_id, prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty FROM line_production WHERE prod_id = $1 FOR UPDATE',
      [prodId],
    );

    if (prodRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Production record not found');
    }
    const currentProd = prodRes.rows[0];

    const targetStyleId = payload.style_id || currentProd.style_id;

    // 2. Lock style row FOR UPDATE
    const styleRes = await client.query(
      'SELECT style_id, style_no, buyer_name, smv, order_qty FROM styles WHERE style_id = $1 FOR UPDATE',
      [targetStyleId],
    );

    if (styleRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Style not found');
    }
    const style = styleRes.rows[0];
    const orderQty = parseInt(style.order_qty, 10);
    const smv = parseFloat(style.smv);

    // 3. Cumulative validation excluding current record
    const updatedOutputQty =
      payload.output_qty !== undefined
        ? payload.output_qty
        : currentProd.output_qty;
    const updatedDefectQty =
      payload.defect_qty !== undefined
        ? payload.defect_qty
        : currentProd.defect_qty;

    if (updatedDefectQty > updatedOutputQty) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'defect_qty cannot exceed output_qty',
      );
    }

    const cumRes = await client.query(
      'SELECT COALESCE(SUM(output_qty), 0)::INT as total_produced FROM line_production WHERE style_id = $1 AND prod_id != $2',
      [targetStyleId, prodId],
    );
    const alreadyProduced = parseInt(cumRes.rows[0].total_produced, 10);
    const remainingQuantity = orderQty - alreadyProduced;

    if (alreadyProduced + updatedOutputQty > orderQty) {
      const err: any = new ApiError(
        httpStatus.BAD_REQUEST,
        'Production quantity exceeds the remaining order quantity',
      );
      err.data = {
        orderQuantity: orderQty,
        alreadyProduced,
        remainingQuantity: Math.max(0, remainingQuantity),
        requestedQuantity: updatedOutputQty,
      };
      throw err;
    }

    const updatedProdDate = payload.prod_date || currentProd.prod_date;
    const updatedFloorNo =
      payload.floor_no !== undefined ? payload.floor_no : currentProd.floor_no;
    const updatedLineNo =
      payload.line_no !== undefined ? payload.line_no : currentProd.line_no;
    const updatedOperators =
      payload.operators_present !== undefined
        ? payload.operators_present
        : currentProd.operators_present;
    const updatedMinutes =
      payload.working_minutes !== undefined
        ? payload.working_minutes
        : currentProd.working_minutes;

    const updateRes = await client.query(
      `UPDATE line_production
       SET prod_date = $1, floor_no = $2, line_no = $3, style_id = $4,
           operators_present = $5, working_minutes = $6, output_qty = $7, defect_qty = $8, updated_at = NOW()
       WHERE prod_id = $9
       RETURNING prod_id, prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty, created_at, updated_at`,
      [
        updatedProdDate,
        updatedFloorNo,
        updatedLineNo,
        targetStyleId,
        updatedOperators,
        updatedMinutes,
        updatedOutputQty,
        updatedDefectQty,
        prodId,
      ],
    );

    await client.query('COMMIT');

    const row = updateRes.rows[0];
    const efficiency = calculateEfficiency(
      row.output_qty,
      smv,
      row.operators_present,
      row.working_minutes,
    );
    const dhu = calculateDHU(row.defect_qty, row.output_qty);

    return {
      ...row,
      style: {
        style_id: style.style_id,
        style_no: style.style_no,
        buyer_name: style.buyer_name,
        smv,
        order_qty: orderQty,
      },
      efficiency,
      dhu,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteProduction = async (prodId: string | number) => {
  const result = await query(
    'DELETE FROM line_production WHERE prod_id = $1 RETURNING prod_id, prod_date, floor_no, line_no, output_qty',
    [prodId],
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Production record not found');
  }

  return result.rows[0];
};

const getProductionSummary = async (queryParams: Record<string, any>) => {
  const { prod_date, startDate, endDate, floor_no } = queryParams;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (prod_date) {
    conditions.push(`lp.prod_date = $${paramIndex}`);
    values.push(prod_date);
    paramIndex++;
  }
  if (startDate) {
    conditions.push(`lp.prod_date >= $${paramIndex}`);
    values.push(startDate);
    paramIndex++;
  }
  if (endDate) {
    conditions.push(`lp.prod_date <= $${paramIndex}`);
    values.push(endDate);
    paramIndex++;
  }
  if (floor_no) {
    conditions.push(`lp.floor_no = $${paramIndex}`);
    values.push(floor_no);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const summaryQuery = `
    SELECT
      COUNT(lp.prod_id)::INT as total_entries,
      COALESCE(SUM(lp.output_qty), 0)::INT as total_output,
      COALESCE(SUM(lp.defect_qty), 0)::INT as total_defects,
      COALESCE(SUM(lp.operators_present * lp.working_minutes), 0)::NUMERIC as total_available_minutes,
      COALESCE(SUM(lp.output_qty * s.smv), 0)::NUMERIC as total_earned_minutes
    FROM line_production lp
    JOIN styles s ON lp.style_id = s.style_id
    ${whereClause}
  `;

  const result = await query(summaryQuery, values);
  const row = result.rows[0];

  const earnedMinutes = parseFloat(row.total_earned_minutes) || 0;
  const availableMinutes = parseFloat(row.total_available_minutes) || 0;
  const totalOutput = parseInt(row.total_output, 10) || 0;
  const totalDefects = parseInt(row.total_defects, 10) || 0;

  const overallEfficiency =
    availableMinutes > 0
      ? Math.round((earnedMinutes / availableMinutes) * 10000) / 100
      : 0;
  const overallDhu =
    totalOutput > 0
      ? Math.round((totalDefects / totalOutput) * 10000) / 100
      : 0;

  return {
    totalEntries: row.total_entries,
    totalOutput,
    totalDefects,
    totalEarnedMinutes: Math.round(earnedMinutes * 100) / 100,
    totalAvailableMinutes: Math.round(availableMinutes * 100) / 100,
    overallEfficiency,
    overallDhu,
  };
};

export const ProductionService = {
  createProduction,
  getAllProduction,
  getProductionById,
  updateProduction,
  deleteProduction,
  getProductionSummary,
  calculateEfficiency,
  calculateDHU,
};

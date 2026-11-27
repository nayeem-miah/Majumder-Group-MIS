import httpStatus from 'http-status';
import { pool, query } from '../../db';
import ApiError from '../../errors/apiError';

export interface StylePayload {
  buyer_name: string;
  style_no: string;
  smv: number;
  order_qty: number;
}

const createStyle = async (payload: StylePayload) => {
  // Check for duplicate style_no
  const existing = await query(
    'SELECT style_id FROM styles WHERE LOWER(style_no) = LOWER($1)',
    [payload.style_no.trim()]
  );
  if (existing.rows.length > 0) {
    throw new ApiError(httpStatus.CONFLICT, `Style number '${payload.style_no}' already exists`);
  }

  const result = await query(
    `INSERT INTO styles (buyer_name, style_no, smv, order_qty)
     VALUES ($1, $2, $3, $4)
     RETURNING style_id, buyer_name, style_no, smv, order_qty, created_at, updated_at`,
    [payload.buyer_name.trim(), payload.style_no.trim(), payload.smv, payload.order_qty]
  );

  return result.rows[0];
};

const getAllStyles = async (queryParams: Record<string, any>) => {
  const { searchTerm, buyer_name, sortBy = 'created_at', sortOrder = 'desc', page = 1, limit = 10 } = queryParams;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (searchTerm) {
    conditions.push(`(style_no ILIKE $${paramIndex} OR buyer_name ILIKE $${paramIndex})`);
    values.push(`%${searchTerm}%`);
    paramIndex++;
  }

  if (buyer_name) {
    conditions.push(`buyer_name ILIKE $${paramIndex}`);
    values.push(`%${buyer_name}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Allowed sort columns
  const allowedSortCols: Record<string, string> = {
    style_id: 's.style_id',
    style_no: 's.style_no',
    buyer_name: 's.buyer_name',
    smv: 's.smv',
    order_qty: 's.order_qty',
    created_at: 's.created_at',
    updated_at: 's.updated_at',
  };
  const sortCol = allowedSortCols[sortBy] || 's.created_at';
  const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) as total FROM styles s ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  // Include cumulative production totals for operational visibility
  const dataQuery = `
    SELECT 
      s.style_id, 
      s.buyer_name, 
      s.style_no, 
      s.smv, 
      s.order_qty,
      COALESCE(SUM(lp.output_qty), 0)::INT as total_produced,
      (s.order_qty - COALESCE(SUM(lp.output_qty), 0))::INT as remaining_qty,
      s.created_at, 
      s.updated_at
    FROM styles s
    LEFT JOIN line_production lp ON s.style_id = lp.style_id
    ${whereClause}
    GROUP BY s.style_id
    ORDER BY ${sortCol} ${sortDir}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataValues = [...values, limitNum, offset];
  const dataResult = await query(dataQuery, dataValues);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage: Math.ceil(total / limitNum),
    },
    data: dataResult.rows,
  };
};

const getStyleById = async (styleId: string | number) => {
  const result = await query(
    `SELECT 
      s.style_id, 
      s.buyer_name, 
      s.style_no, 
      s.smv, 
      s.order_qty,
      COALESCE(SUM(lp.output_qty), 0)::INT as total_produced,
      (s.order_qty - COALESCE(SUM(lp.output_qty), 0))::INT as remaining_qty,
      s.created_at, 
      s.updated_at
    FROM styles s
    LEFT JOIN line_production lp ON s.style_id = lp.style_id
    WHERE s.style_id = $1
    GROUP BY s.style_id`,
    [styleId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Style not found');
  }

  return result.rows[0];
};

const updateStyle = async (styleId: string | number, payload: Partial<StylePayload>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock style row with FOR UPDATE
    const styleRes = await client.query(
      'SELECT style_id, buyer_name, style_no, smv, order_qty FROM styles WHERE style_id = $1 FOR UPDATE',
      [styleId]
    );

    if (styleRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Style not found');
    }
    const currentStyle = styleRes.rows[0];

    // If updating style_no, check uniqueness
    if (payload.style_no && payload.style_no.trim().toLowerCase() !== currentStyle.style_no.toLowerCase()) {
      const dupCheck = await client.query(
        'SELECT style_id FROM styles WHERE LOWER(style_no) = LOWER($1) AND style_id != $2',
        [payload.style_no.trim(), styleId]
      );
      if (dupCheck.rows.length > 0) {
        throw new ApiError(httpStatus.CONFLICT, `Style number '${payload.style_no}' already exists`);
      }
    }

    // If updating order_qty, validate it does not fall below existing cumulative production
    if (payload.order_qty !== undefined) {
      const prodSumRes = await client.query(
        'SELECT COALESCE(SUM(output_qty), 0)::INT as total_produced FROM line_production WHERE style_id = $1',
        [styleId]
      );
      const totalProduced = parseInt(prodSumRes.rows[0].total_produced, 10);

      if (payload.order_qty < totalProduced) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Cannot reduce order_qty to ${payload.order_qty}. Existing cumulative production is ${totalProduced}.`
        );
      }
    }

    const updatedBuyer = payload.buyer_name ? payload.buyer_name.trim() : currentStyle.buyer_name;
    const updatedStyleNo = payload.style_no ? payload.style_no.trim() : currentStyle.style_no;
    const updatedSmv = payload.smv !== undefined ? payload.smv : currentStyle.smv;
    const updatedOrderQty = payload.order_qty !== undefined ? payload.order_qty : currentStyle.order_qty;

    const updateRes = await client.query(
      `UPDATE styles
       SET buyer_name = $1, style_no = $2, smv = $3, order_qty = $4, updated_at = NOW()
       WHERE style_id = $5
       RETURNING style_id, buyer_name, style_no, smv, order_qty, created_at, updated_at`,
      [updatedBuyer, updatedStyleNo, updatedSmv, updatedOrderQty, styleId]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteStyle = async (styleId: string | number) => {
  // Check if any production records depend on this style
  const checkDep = await query(
    'SELECT COUNT(*)::INT as count FROM line_production WHERE style_id = $1',
    [styleId]
  );

  const count = checkDep.rows[0].count;
  if (count > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete style. ${count} production record(s) are linked to this style.`
    );
  }

  const deleteRes = await query(
    'DELETE FROM styles WHERE style_id = $1 RETURNING style_id, style_no, buyer_name',
    [styleId]
  );

  if (deleteRes.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Style not found');
  }

  return deleteRes.rows[0];
};

export const StyleService = {
  createStyle,
  getAllStyles,
  getStyleById,
  updateStyle,
  deleteStyle,
};

import httpStatus from 'http-status';
import { query } from '../../db';
import ApiError from '../../errors/apiError';

export interface VehiclePayload {
  reg_no: string;
  vehicle_type: string;
  seat_capacity: number;
  status?: 'Active' | 'Under Maintenance';
}

const createVehicle = async (payload: VehiclePayload) => {
  const existing = await query(
    'SELECT vehicle_id FROM vehicles WHERE LOWER(reg_no) = LOWER($1)',
    [payload.reg_no.trim()]
  );
  if (existing.rows.length > 0) {
    throw new ApiError(httpStatus.CONFLICT, `Vehicle registration '${payload.reg_no}' already exists`);
  }

  const result = await query(
    `INSERT INTO vehicles (reg_no, vehicle_type, seat_capacity, status)
     VALUES ($1, $2, $3, $4)
     RETURNING vehicle_id, reg_no, vehicle_type, seat_capacity, status, created_at, updated_at`,
    [
      payload.reg_no.trim(),
      payload.vehicle_type.trim(),
      payload.seat_capacity,
      payload.status || 'Active',
    ]
  );

  return result.rows[0];
};

const getAllVehicles = async (queryParams: Record<string, any>) => {
  const { searchTerm, vehicle_type, status, sortBy = 'created_at', sortOrder = 'desc', page = 1, limit = 10 } = queryParams;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (searchTerm) {
    conditions.push(`(reg_no ILIKE $${paramIndex} OR vehicle_type ILIKE $${paramIndex})`);
    values.push(`%${searchTerm}%`);
    paramIndex++;
  }

  if (vehicle_type) {
    conditions.push(`vehicle_type ILIKE $${paramIndex}`);
    values.push(`%${vehicle_type}%`);
    paramIndex++;
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortCols: Record<string, string> = {
    vehicle_id: 'vehicle_id',
    reg_no: 'reg_no',
    vehicle_type: 'vehicle_type',
    seat_capacity: 'seat_capacity',
    status: 'status',
    created_at: 'created_at',
  };
  const sortCol = allowedSortCols[sortBy] || 'created_at';
  const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) as total FROM vehicles ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  const dataQuery = `
    SELECT vehicle_id, reg_no, vehicle_type, seat_capacity, status, created_at, updated_at
    FROM vehicles
    ${whereClause}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataResult = await query(dataQuery, [...values, limitNum, offset]);

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

const getVehicleById = async (vehicleId: string | number) => {
  const result = await query(
    `SELECT vehicle_id, reg_no, vehicle_type, seat_capacity, status, created_at, updated_at
     FROM vehicles
     WHERE vehicle_id = $1`,
    [vehicleId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }

  return result.rows[0];
};

const updateVehicle = async (vehicleId: string | number, payload: Partial<VehiclePayload>) => {
  const existing = await query('SELECT vehicle_id, reg_no, status FROM vehicles WHERE vehicle_id = $1', [vehicleId]);
  if (existing.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }

  if (payload.reg_no && payload.reg_no.trim().toLowerCase() !== existing.rows[0].reg_no.toLowerCase()) {
    const dupCheck = await query(
      'SELECT vehicle_id FROM vehicles WHERE LOWER(reg_no) = LOWER($1) AND vehicle_id != $2',
      [payload.reg_no.trim(), vehicleId]
    );
    if (dupCheck.rows.length > 0) {
      throw new ApiError(httpStatus.CONFLICT, `Vehicle registration '${payload.reg_no}' already exists`);
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (payload.reg_no) {
    fields.push(`reg_no = $${paramIndex++}`);
    values.push(payload.reg_no.trim());
  }
  if (payload.vehicle_type) {
    fields.push(`vehicle_type = $${paramIndex++}`);
    values.push(payload.vehicle_type.trim());
  }
  if (payload.seat_capacity !== undefined) {
    fields.push(`seat_capacity = $${paramIndex++}`);
    values.push(payload.seat_capacity);
  }
  if (payload.status) {
    fields.push(`status = $${paramIndex++}`);
    values.push(payload.status);
  }

  if (fields.length === 0) {
    return existing.rows[0];
  }

  fields.push(`updated_at = NOW()`);
  values.push(vehicleId);

  const updateQuery = `
    UPDATE vehicles
    SET ${fields.join(', ')}
    WHERE vehicle_id = $${paramIndex}
    RETURNING vehicle_id, reg_no, vehicle_type, seat_capacity, status, created_at, updated_at
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
};

const updateVehicleStatus = async (vehicleId: string | number, status: 'Active' | 'Under Maintenance') => {
  const result = await query(
    `UPDATE vehicles
     SET status = $1, updated_at = NOW()
     WHERE vehicle_id = $2
     RETURNING vehicle_id, reg_no, vehicle_type, seat_capacity, status, created_at, updated_at`,
    [status, vehicleId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }

  return result.rows[0];
};

const deleteVehicle = async (vehicleId: string | number) => {
  // Check if vehicle has any trip history
  const checkTrips = await query(
    'SELECT COUNT(*)::INT as count FROM trips WHERE vehicle_id = $1',
    [vehicleId]
  );

  const count = checkTrips.rows[0].count;
  if (count > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete vehicle. ${count} trip record(s) are linked to this vehicle.`
    );
  }

  const result = await query(
    'DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING vehicle_id, reg_no, vehicle_type',
    [vehicleId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }

  return result.rows[0];
};

export const VehicleService = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
};

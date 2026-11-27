import httpStatus from 'http-status';
import { pool, query } from '../../db';
import ApiError from '../../errors/apiError';

export interface TripPayload {
  vehicle_id: string | number;
  route_name: string;
  departure_time: string;
  estimated_return_time: string;
  passenger_count: number;
  status?: 'Scheduled' | 'Dispatched' | 'Completed' | 'Cancelled';
}

const createTrip = async (payload: TripPayload) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock vehicle and verify status and seat capacity
    const vehRes = await client.query(
      'SELECT vehicle_id, reg_no, vehicle_type, seat_capacity, status FROM vehicles WHERE vehicle_id = $1 FOR UPDATE',
      [payload.vehicle_id]
    );

    if (vehRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
    }

    const vehicle = vehRes.rows[0];

    // 2. Maintenance validation: Maintenance vehicles cannot be booked
    if (vehicle.status === 'Under Maintenance') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot book trip: Vehicle '${vehicle.reg_no}' is Under Maintenance`
      );
    }

    // 3. Seat capacity validation
    if (payload.passenger_count > vehicle.seat_capacity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Passenger count (${payload.passenger_count}) exceeds vehicle seat capacity (${vehicle.seat_capacity})`
      );
    }

    // 4. Time Overlap Conflict Detection:
    // Overlap condition: existing_departure < new_return AND existing_return > new_departure
    // Only trips with status 'Scheduled' or 'Dispatched' block availability
    const conflictRes = await client.query(
      `SELECT trip_id, route_name, departure_time, estimated_return_time, status
       FROM trips
       WHERE vehicle_id = $1
         AND status IN ('Scheduled', 'Dispatched')
         AND departure_time < $2
         AND estimated_return_time > $3`,
      [payload.vehicle_id, payload.estimated_return_time, payload.departure_time]
    );

    if (conflictRes.rows.length > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Vehicle is already booked during this time period'
      );
    }

    // 5. Insert trip
    const insertRes = await client.query(
      `INSERT INTO trips (
        vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING trip_id, vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status, created_at, updated_at`,
      [
        payload.vehicle_id,
        payload.route_name.trim(),
        payload.departure_time,
        payload.estimated_return_time,
        payload.passenger_count,
        payload.status || 'Scheduled',
      ]
    );

    await client.query('COMMIT');
    return {
      ...insertRes.rows[0],
      vehicle,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllTrips = async (queryParams: Record<string, any>) => {
  const {
    vehicle_id,
    status,
    startDate,
    endDate,
    sortBy = 'departure_time',
    sortOrder = 'asc',
    page = 1,
    limit = 10,
  } = queryParams;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (vehicle_id) {
    conditions.push(`t.vehicle_id = $${paramIndex++}`);
    values.push(vehicle_id);
  }
  if (status) {
    conditions.push(`t.status = $${paramIndex++}`);
    values.push(status);
  }
  if (startDate) {
    conditions.push(`t.departure_time >= $${paramIndex++}`);
    values.push(startDate);
  }
  if (endDate) {
    conditions.push(`t.departure_time <= $${paramIndex++}`);
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortCols: Record<string, string> = {
    trip_id: 't.trip_id',
    departure_time: 't.departure_time',
    estimated_return_time: 't.estimated_return_time',
    passenger_count: 't.passenger_count',
    status: 't.status',
    created_at: 't.created_at',
  };
  const sortCol = allowedSortCols[sortBy] || 't.departure_time';
  const sortDir = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const countQuery = `SELECT COUNT(*) as total FROM trips t ${whereClause}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  const dataQuery = `
    SELECT 
      t.trip_id,
      t.vehicle_id,
      v.reg_no,
      v.vehicle_type,
      v.seat_capacity,
      t.route_name,
      t.departure_time,
      t.estimated_return_time,
      t.passenger_count,
      t.status,
      t.created_at,
      t.updated_at
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.vehicle_id
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

const getTripById = async (tripId: string | number) => {
  const result = await query(
    `SELECT 
      t.trip_id,
      t.vehicle_id,
      v.reg_no,
      v.vehicle_type,
      v.seat_capacity,
      v.status as vehicle_status,
      t.route_name,
      t.departure_time,
      t.estimated_return_time,
      t.passenger_count,
      t.status,
      t.created_at,
      t.updated_at
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.vehicle_id
    WHERE t.trip_id = $1`,
    [tripId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
  }

  return result.rows[0];
};

const updateTrip = async (tripId: string | number, payload: Partial<TripPayload>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current trip with FOR UPDATE
    const currentRes = await client.query('SELECT * FROM trips WHERE trip_id = $1 FOR UPDATE', [tripId]);
    if (currentRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
    }
    const currentTrip = currentRes.rows[0];

    const targetVehicleId = payload.vehicle_id || currentTrip.vehicle_id;
    const targetDeparture = payload.departure_time || currentTrip.departure_time;
    const targetReturn = payload.estimated_return_time || currentTrip.estimated_return_time;
    const targetPassengers = payload.passenger_count !== undefined ? payload.passenger_count : currentTrip.passenger_count;
    const targetStatus = payload.status || currentTrip.status;

    // Verify departure < return
    if (new Date(targetDeparture).getTime() >= new Date(targetReturn).getTime()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'departure_time must be earlier than estimated_return_time');
    }

    // Lock vehicle
    const vehRes = await client.query(
      'SELECT vehicle_id, reg_no, seat_capacity, status FROM vehicles WHERE vehicle_id = $1 FOR UPDATE',
      [targetVehicleId]
    );
    if (vehRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
    }
    const vehicle = vehRes.rows[0];

    if (vehicle.status === 'Under Maintenance') {
      throw new ApiError(httpStatus.BAD_REQUEST, `Vehicle '${vehicle.reg_no}' is Under Maintenance`);
    }

    if (targetPassengers > vehicle.seat_capacity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Passenger count (${targetPassengers}) exceeds vehicle seat capacity (${vehicle.seat_capacity})`
      );
    }

    // Time overlap check excluding current trip
    if (['Scheduled', 'Dispatched'].includes(targetStatus)) {
      const conflictRes = await client.query(
        `SELECT trip_id FROM trips
         WHERE vehicle_id = $1
           AND trip_id != $2
           AND status IN ('Scheduled', 'Dispatched')
           AND departure_time < $3
           AND estimated_return_time > $4`,
        [targetVehicleId, tripId, targetReturn, targetDeparture]
      );

      if (conflictRes.rows.length > 0) {
        throw new ApiError(httpStatus.CONFLICT, 'Vehicle is already booked during this time period');
      }
    }

    const updateRes = await client.query(
      `UPDATE trips
       SET vehicle_id = $1, route_name = $2, departure_time = $3, estimated_return_time = $4,
           passenger_count = $5, status = $6, updated_at = NOW()
       WHERE trip_id = $7
       RETURNING trip_id, vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status, created_at, updated_at`,
      [
        targetVehicleId,
        (payload.route_name || currentTrip.route_name).trim(),
        targetDeparture,
        targetReturn,
        targetPassengers,
        targetStatus,
        tripId,
      ]
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

const dispatchTrip = async (tripId: string | number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripRes = await client.query(
      'SELECT t.*, v.status as vehicle_status FROM trips t JOIN vehicles v ON t.vehicle_id = v.vehicle_id WHERE t.trip_id = $1 FOR UPDATE',
      [tripId]
    );

    if (tripRes.rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
    }
    const trip = tripRes.rows[0];

    if (trip.status !== 'Scheduled') {
      throw new ApiError(httpStatus.BAD_REQUEST, `Cannot dispatch trip with status '${trip.status}'. Must be 'Scheduled'`);
    }

    if (trip.vehicle_status === 'Under Maintenance') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot dispatch trip: Assigned vehicle is Under Maintenance');
    }

    const updateRes = await client.query(
      "UPDATE trips SET status = 'Dispatched', updated_at = NOW() WHERE trip_id = $1 RETURNING *",
      [tripId]
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

const completeTrip = async (tripId: string | number) => {
  const current = await query('SELECT trip_id, status FROM trips WHERE trip_id = $1', [tripId]);
  if (current.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
  }

  if (current.rows[0].status !== 'Dispatched') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot complete trip with status '${current.rows[0].status}'. Must be 'Dispatched'`);
  }

  const result = await query(
    "UPDATE trips SET status = 'Completed', updated_at = NOW() WHERE trip_id = $1 RETURNING *",
    [tripId]
  );
  return result.rows[0];
};

const cancelTrip = async (tripId: string | number) => {
  const current = await query('SELECT trip_id, status FROM trips WHERE trip_id = $1', [tripId]);
  if (current.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found');
  }

  if (current.rows[0].status === 'Completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel a Completed trip');
  }

  const result = await query(
    "UPDATE trips SET status = 'Cancelled', updated_at = NOW() WHERE trip_id = $1 RETURNING *",
    [tripId]
  );
  return result.rows[0];
};

const getVehicleAvailability = async (queryParams: Record<string, any>) => {
  const { departure_time, estimated_return_time, min_capacity } = queryParams;

  if (!departure_time || !estimated_return_time) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'departure_time and estimated_return_time are required query parameters');
  }

  const cap = parseInt(min_capacity, 10) || 1;

  // Find all active vehicles that do NOT have any overlapping Scheduled or Dispatched trip
  const result = await query(
    `SELECT v.vehicle_id, v.reg_no, v.vehicle_type, v.seat_capacity, v.status
     FROM vehicles v
     WHERE v.status = 'Active'
       AND v.seat_capacity >= $1
       AND v.vehicle_id NOT IN (
         SELECT vehicle_id
         FROM trips
         WHERE status IN ('Scheduled', 'Dispatched')
           AND departure_time < $2
           AND estimated_return_time > $3
       )
     ORDER BY v.seat_capacity ASC`,
    [cap, estimated_return_time, departure_time]
  );

  return result.rows;
};

export const TripService = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getVehicleAvailability,
};

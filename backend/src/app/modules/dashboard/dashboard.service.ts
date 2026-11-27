import { query } from '../../db';

export interface DashboardFilter {
  startDate?: string;
  endDate?: string;
  buyer_name?: string;
  style_no?: string;
}

/**
 * 7.1 Overall Factory Efficiency
 * Formula: Overall Efficiency % = (Total Earned Minutes / Total Available Operator Minutes) × 100
 * Earned Minutes = SUM(output_qty × style.smv)
 * Available Minutes = SUM(operators_present × working_minutes)
 * Weighted average efficiency across the production records.
 */
const getOverallFactoryEfficiency = async (filter: DashboardFilter) => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filter.startDate) {
    conditions.push(`lp.prod_date >= $${paramIndex++}`);
    values.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push(`lp.prod_date <= $${paramIndex++}`);
    values.push(filter.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      COALESCE(SUM(lp.output_qty * s.smv), 0)::NUMERIC as total_earned_minutes,
      COALESCE(SUM(lp.operators_present * lp.working_minutes), 0)::NUMERIC as total_available_minutes,
      COALESCE(SUM(lp.output_qty), 0)::INT as total_output,
      COALESCE(SUM(lp.defect_qty), 0)::INT as total_defects
    FROM line_production lp
    JOIN styles s ON lp.style_id = s.style_id
    ${whereClause}
  `;

  const result = await query(sql, values);
  const row = result.rows[0];

  const earnedMinutes = parseFloat(row.total_earned_minutes) || 0;
  const availableMinutes = parseFloat(row.total_available_minutes) || 0;
  const totalOutput = parseInt(row.total_output, 10) || 0;
  const totalDefects = parseInt(row.total_defects, 10) || 0;

  const percentage = availableMinutes > 0 ? Math.round((earnedMinutes / availableMinutes) * 10000) / 100 : 0;
  const dhuPercentage = totalOutput > 0 ? Math.round((totalDefects / totalOutput) * 10000) / 100 : 0;

  return {
    percentage,
    totalEarnedMinutes: Math.round(earnedMinutes * 100) / 100,
    totalAvailableMinutes: Math.round(availableMinutes * 100) / 100,
    totalOutput,
    totalDefects,
    dhuPercentage,
  };
};

/**
 * 7.2 Critical Bottleneck Lines
 * Finds production lines with efficiency below 65%.
 * Required Output = CEIL((0.65 × Operators Present × Working Minutes) / SMV)
 * Additional Pieces = MAX(0, Required Output - Current Output)
 */
const getCriticalBottleneckLines = async (filter: DashboardFilter) => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filter.startDate) {
    conditions.push(`lp.prod_date >= $${paramIndex++}`);
    values.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push(`lp.prod_date <= $${paramIndex++}`);
    values.push(filter.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      lp.floor_no,
      lp.line_no,
      s.style_no,
      s.buyer_name,
      s.smv,
      SUM(lp.operators_present)::INT as total_operators,
      SUM(lp.working_minutes)::INT as total_working_minutes,
      SUM(lp.output_qty)::INT as total_output,
      SUM(lp.defect_qty)::INT as total_defects,
      SUM(lp.output_qty * s.smv)::NUMERIC as line_earned_minutes,
      SUM(lp.operators_present * lp.working_minutes)::NUMERIC as line_available_minutes
    FROM line_production lp
    JOIN styles s ON lp.style_id = s.style_id
    ${whereClause}
    GROUP BY lp.floor_no, lp.line_no, s.style_no, s.buyer_name, s.smv
    HAVING SUM(lp.operators_present * lp.working_minutes) > 0
  `;

  const result = await query(sql, values);
  const bottlenecks: any[] = [];

  for (const row of result.rows) {
    const earned = parseFloat(row.line_earned_minutes) || 0;
    const available = parseFloat(row.line_available_minutes) || 0;
    const currentEff = available > 0 ? Math.round((earned / available) * 10000) / 100 : 0;
    const smv = parseFloat(row.smv);

    if (currentEff < 65.0) {
      // Required Output to hit 65% efficiency:
      // (Required Output * SMV) / Available = 0.65 => Required Output = (0.65 * Available) / SMV
      const requiredOutput = smv > 0 ? Math.ceil((0.65 * available) / smv) : 0;
      const additionalPieces = Math.max(0, requiredOutput - row.total_output);

      bottlenecks.push({
        floor_no: row.floor_no,
        line_no: row.line_no,
        style_no: row.style_no,
        buyer_name: row.buyer_name,
        smv,
        totalOperators: row.total_operators,
        totalWorkingMinutes: row.total_working_minutes,
        totalOutput: row.total_output,
        currentEfficiency: currentEff,
        targetEfficiency: 65.0,
        requiredOutput,
        additionalPiecesNeeded: additionalPieces,
      });
    }
  }

  // Sort by lowest efficiency first
  bottlenecks.sort((a, b) => a.currentEfficiency - b.currentEfficiency);

  return bottlenecks;
};

/**
 * 7.3 Fleet Utilization
 * Fleet Utilization % = (Active Vehicles Currently Dispatched / Total Active Vehicles) × 100
 * Uses current database time (NOW()) and active trip status to determine currently dispatched vehicles.
 * Under Maintenance vehicles must not be counted as active available vehicles.
 */
const getFleetUtilization = async () => {
  const sql = `
    SELECT
      COUNT(DISTINCT v.vehicle_id)::INT as total_active_vehicles,
      COUNT(DISTINCT CASE 
        WHEN t.status = 'Dispatched' 
          AND t.departure_time <= NOW() 
          AND t.estimated_return_time >= NOW() 
        THEN v.vehicle_id 
        ELSE NULL 
      END)::INT as dispatched_vehicles
    FROM vehicles v
    LEFT JOIN trips t ON v.vehicle_id = t.vehicle_id
    WHERE v.status = 'Active'
  `;

  const result = await query(sql);
  const row = result.rows[0];

  const totalActive = parseInt(row.total_active_vehicles, 10) || 0;
  const dispatched = parseInt(row.dispatched_vehicles, 10) || 0;
  const idle = Math.max(0, totalActive - dispatched);
  const percentage = totalActive > 0 ? Math.round((dispatched / totalActive) * 10000) / 100 : 0;

  return {
    totalActiveVehicles: totalActive,
    dispatchedVehicles: dispatched,
    idleVehicles: idle,
    percentage,
  };
};

/**
 * 7.4 Style Completion Progress
 * Completion % = (Total Produced / Order Quantity) × 100 (never exceeds 100%)
 */
const getStyleCompletionProgress = async (filter: DashboardFilter) => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filter.buyer_name) {
    conditions.push(`s.buyer_name ILIKE $${paramIndex++}`);
    values.push(`%${filter.buyer_name}%`);
  }
  if (filter.style_no) {
    conditions.push(`s.style_no ILIKE $${paramIndex++}`);
    values.push(`%${filter.style_no}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      s.style_id,
      s.style_no,
      s.buyer_name,
      s.smv,
      s.order_qty,
      COALESCE(SUM(lp.output_qty), 0)::INT as total_produced
    FROM styles s
    LEFT JOIN line_production lp ON s.style_id = lp.style_id
    ${whereClause}
    GROUP BY s.style_id
    ORDER BY s.created_at DESC
  `;

  const result = await query(sql, values);

  return result.rows.map((row) => {
    const orderQty = parseInt(row.order_qty, 10);
    const totalProduced = parseInt(row.total_produced, 10);
    const remainingQty = Math.max(0, orderQty - totalProduced);
    const rawCompletion = orderQty > 0 ? (totalProduced / orderQty) * 100 : 0;
    const completionPercentage = Math.min(100, Math.round(rawCompletion * 100) / 100);

    return {
      style_id: row.style_id,
      style_no: row.style_no,
      buyer_name: row.buyer_name,
      smv: parseFloat(row.smv),
      orderQuantity: orderQty,
      totalProduced,
      remainingQuantity: remainingQty,
      completionPercentage,
    };
  });
};

/**
 * Aggregates complete Executive MIS Dashboard summary
 */
const getDashboardSummary = async (filter: DashboardFilter) => {
  const [overallEfficiency, bottleneckLines, fleetUtilization, styleCompletion] = await Promise.all([
    getOverallFactoryEfficiency(filter),
    getCriticalBottleneckLines(filter),
    getFleetUtilization(),
    getStyleCompletionProgress(filter),
  ]);

  return {
    overallEfficiency,
    bottleneckLines,
    fleetUtilization,
    styleCompletion,
  };
};

export const DashboardService = {
  getDashboardSummary,
  getOverallFactoryEfficiency,
  getCriticalBottleneckLines,
  getFleetUtilization,
  getStyleCompletionProgress,
};

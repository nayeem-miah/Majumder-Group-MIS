import { z } from 'zod';

const createProductionSchema = z.object({
  body: z.object({
    prod_date: z.string({ message: 'prod_date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'prod_date must be in YYYY-MM-DD format'),
    floor_no: z.number({ message: 'floor_no is required' }).int().positive('floor_no must be positive'),
    line_no: z.number({ message: 'line_no is required' }).int().positive('line_no must be positive'),
    style_id: z.union([z.string(), z.number()], { message: 'style_id is required' }),
    operators_present: z.number({ message: 'operators_present is required' }).int().positive('operators_present must be greater than zero'),
    working_minutes: z.number({ message: 'working_minutes is required' }).int().positive('working_minutes must be greater than zero'),
    output_qty: z.number({ message: 'output_qty is required' }).int().min(0, 'output_qty cannot be negative'),
    defect_qty: z.number({ message: 'defect_qty is required' }).int().min(0, 'defect_qty cannot be negative'),
  }).refine((data) => data.defect_qty <= data.output_qty, {
    message: 'defect_qty cannot exceed output_qty',
    path: ['defect_qty'],
  }),
});

const updateProductionSchema = z.object({
  body: z.object({
    prod_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'prod_date must be in YYYY-MM-DD format').optional(),
    floor_no: z.number().int().positive('floor_no must be positive').optional(),
    line_no: z.number().int().positive('line_no must be positive').optional(),
    style_id: z.union([z.string(), z.number()]).optional(),
    operators_present: z.number().int().positive('operators_present must be greater than zero').optional(),
    working_minutes: z.number().int().positive('working_minutes must be greater than zero').optional(),
    output_qty: z.number().int().min(0, 'output_qty cannot be negative').optional(),
    defect_qty: z.number().int().min(0, 'defect_qty cannot be negative').optional(),
  }).refine((data) => {
    if (data.output_qty !== undefined && data.defect_qty !== undefined) {
      return data.defect_qty <= data.output_qty;
    }
    return true;
  }, {
    message: 'defect_qty cannot exceed output_qty',
    path: ['defect_qty'],
  }),
});

export const ProductionValidation = {
  createProductionSchema,
  updateProductionSchema,
};

import { z } from 'zod';

const createVehicleSchema = z.object({
  body: z.object({
    reg_no: z.string({ message: 'reg_no is required' }).trim().min(1, 'reg_no cannot be empty'),
    vehicle_type: z.string({ message: 'vehicle_type is required' }).trim().min(1, 'vehicle_type cannot be empty'),
    seat_capacity: z.number({ message: 'seat_capacity is required' }).int('seat_capacity must be an integer').positive('seat_capacity must be greater than zero'),
    status: z.enum(['Active', 'Under Maintenance']).default('Active'),
  }),
});

const updateVehicleSchema = z.object({
  body: z.object({
    reg_no: z.string().trim().min(1).optional(),
    vehicle_type: z.string().trim().min(1).optional(),
    seat_capacity: z.number().int().positive().optional(),
    status: z.enum(['Active', 'Under Maintenance']).optional(),
  }),
});

const updateVehicleStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Active', 'Under Maintenance'], {
      message: "Status must be either 'Active' or 'Under Maintenance'",
    }),
  }),
});

export const VehicleValidation = {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
};

import { z } from 'zod';

const createTripSchema = z.object({
  body: z.object({
    vehicle_id: z.union([z.string(), z.number()], { message: 'vehicle_id is required' }),
    route_name: z.string({ message: 'route_name is required' }).trim().min(1, 'route_name cannot be empty'),
    departure_time: z.string({ message: 'departure_time is required' }),
    estimated_return_time: z.string({ message: 'estimated_return_time is required' }),
    passenger_count: z.number({ message: 'passenger_count is required' }).int().positive('passenger_count must be positive'),
    status: z.enum(['Scheduled', 'Dispatched', 'Completed', 'Cancelled']).default('Scheduled'),
  }).refine((data) => new Date(data.departure_time).getTime() < new Date(data.estimated_return_time).getTime(), {
    message: 'departure_time must be earlier than estimated_return_time',
    path: ['estimated_return_time'],
  }),
});

const updateTripSchema = z.object({
  body: z.object({
    vehicle_id: z.union([z.string(), z.number()]).optional(),
    route_name: z.string().trim().min(1).optional(),
    departure_time: z.string().optional(),
    estimated_return_time: z.string().optional(),
    passenger_count: z.number().int().positive().optional(),
    status: z.enum(['Scheduled', 'Dispatched', 'Completed', 'Cancelled']).optional(),
  }).refine((data) => {
    if (data.departure_time && data.estimated_return_time) {
      return new Date(data.departure_time).getTime() < new Date(data.estimated_return_time).getTime();
    }
    return true;
  }, {
    message: 'departure_time must be earlier than estimated_return_time',
    path: ['estimated_return_time'],
  }),
});

export const TripValidation = {
  createTripSchema,
  updateTripSchema,
};

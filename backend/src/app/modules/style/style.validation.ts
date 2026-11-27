import { z } from 'zod';

const createStyleSchema = z.object({
  body: z.object({
    buyer_name: z.string({ message: 'buyer_name is required' }).trim().min(1, 'buyer_name cannot be empty'),
    style_no: z.string({ message: 'style_no is required' }).trim().min(1, 'style_no cannot be empty'),
    smv: z.number({ message: 'smv is required' }).positive('smv must be greater than zero'),
    order_qty: z.number({ message: 'order_qty is required' }).int('order_qty must be an integer').positive('order_qty must be a positive integer'),
  }),
});

const updateStyleSchema = z.object({
  body: z.object({
    buyer_name: z.string().trim().min(1, 'buyer_name cannot be empty').optional(),
    style_no: z.string().trim().min(1, 'style_no cannot be empty').optional(),
    smv: z.number().positive('smv must be greater than zero').optional(),
    order_qty: z.number().int('order_qty must be an integer').positive('order_qty must be a positive integer').optional(),
  }),
});

export const StyleValidation = {
  createStyleSchema,
  updateStyleSchema,
};

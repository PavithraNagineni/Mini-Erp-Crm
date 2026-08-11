import { z } from "zod";

export const challanItemSchema = z.object({
  productId: z.string().uuid("Valid productId is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid("Valid customerId is required"),
  items: z.array(challanItemSchema).min(1, "At least one product line item is required"),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;

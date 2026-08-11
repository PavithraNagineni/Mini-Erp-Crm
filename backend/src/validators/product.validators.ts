import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  unitPrice: z.number().nonnegative("Unit price must be >= 0"),
  currentStock: z.number().int().nonnegative().optional(),
  minStockAlert: z.number().int().nonnegative().optional(),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  quantityChanged: z.number().int().positive("Quantity must be a positive integer"),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;

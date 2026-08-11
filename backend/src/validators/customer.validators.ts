import { z } from "zod";

export const customerTypeEnum = z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]);
export const customerStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(6, "Valid mobile number is required"),
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: customerTypeEnum,
  address: z.string().optional(),
  status: customerStatusEnum.optional(),
  followUpDate: z.string().datetime().optional().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addCustomerNoteSchema = z.object({
  note: z.string().min(1, "Note text is required"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

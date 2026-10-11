import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis"),
  supplyType: z.string().trim().min(2, "Le type de fourniture est requis"),
  annualAmount: z.coerce.number().nonnegative().default(0),
  notes: z.string().trim().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

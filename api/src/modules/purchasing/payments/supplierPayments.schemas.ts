import { z } from "zod";

export const createSupplierPaymentSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.coerce.date(),
  method: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type CreateSupplierPaymentInput = z.infer<
  typeof createSupplierPaymentSchema
>;

import { z } from "zod";

export const createCashflowLineSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  type: z.enum(["Encaissement", "Décaissement"]),
  category: z.string().trim().min(2, "La catégorie est requise"),
  label: z.string().trim().min(2, "Le libellé est requis"),
  amount: z.coerce.number().nonnegative(),
});

export const updateCashflowLineSchema = createCashflowLineSchema.partial();

export type CreateCashflowLineInput = z.infer<typeof createCashflowLineSchema>;
export type UpdateCashflowLineInput = z.infer<typeof updateCashflowLineSchema>;

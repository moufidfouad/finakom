import { z } from "zod";

export const upsertIncomeBudgetLineSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  type: z.enum(["Produit", "Charge"]),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.coerce.number().nonnegative(),
});

export type UpsertIncomeBudgetLineInput = z.infer<
  typeof upsertIncomeBudgetLineSchema
>;

import { z } from "zod";

export const upsertBudgetLineSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  rubric: z.string().trim().min(2, "La rubrique est requise"),
  type: z.enum(["Encaissement", "Décaissement"]),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.coerce.number().nonnegative(),
});

export type UpsertBudgetLineInput = z.infer<typeof upsertBudgetLineSchema>;

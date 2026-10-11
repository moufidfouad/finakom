import { z } from "zod";

export const upsertMonthlyPayrollTaxSchema = z.object({
  period: z.coerce.date(),
  grossPayroll: z.coerce.number().nonnegative(),
  paid: z.boolean().optional(),
});

export type UpsertMonthlyPayrollTaxInput = z.infer<
  typeof upsertMonthlyPayrollTaxSchema
>;

export const listPayrollTaxQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

import { z } from "zod";

export const upsertCorporateTaxReturnSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  accountingResult: z.coerce.number().default(0),
  fiscalReintegrations: z.coerce.number().nonnegative().default(0),
  fiscalDeductions: z.coerce.number().nonnegative().default(0),
  priorYearLoss: z.coerce.number().nonnegative().default(0),
  annualRevenue: z.coerce.number().nonnegative().default(0),
  priorYearTax: z.coerce.number().nonnegative().default(0),
  taxCredits: z.coerce.number().nonnegative().default(0),
  installmentsPaidQ1: z.coerce.number().nonnegative().default(0),
  installmentsPaidQ2: z.coerce.number().nonnegative().default(0),
  installmentsPaidQ3: z.coerce.number().nonnegative().default(0),
  installmentsPaidQ4: z.coerce.number().nonnegative().default(0),
});

export type UpsertCorporateTaxReturnInput = z.infer<
  typeof upsertCorporateTaxReturnSchema
>;

export const fiscalYearQuerySchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
});

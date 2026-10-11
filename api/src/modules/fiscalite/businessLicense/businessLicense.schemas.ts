import { z } from "zod";

export const upsertBusinessLicenseReturnSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  annualRevenue: z.coerce.number().nonnegative().default(0),
  fixedDuty: z.coerce.number().nonnegative().default(0),
  paid: z.boolean().default(false),
});

export type UpsertBusinessLicenseReturnInput = z.infer<
  typeof upsertBusinessLicenseReturnSchema
>;

export const fiscalYearQuerySchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  monthsLate: z.coerce.number().int().nonnegative().default(0),
});

import { z } from "zod";

export const upsertMonthlyVatReturnSchema = z.object({
  period: z.coerce.date(), // premier jour du mois concerné
  salesIncTax: z.coerce.number().nonnegative(),
  purchasesIncTax: z.coerce.number().nonnegative().default(0),
  status: z.enum(["À déclarer", "Déclarée", "Payée"]).optional(),
});

export type UpsertMonthlyVatReturnInput = z.infer<
  typeof upsertMonthlyVatReturnSchema
>;

export const listVatReturnsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

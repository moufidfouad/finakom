import { z } from "zod";

export const upsertTreasurySettingsSchema = z.object({
  openingCashBalance: z.coerce.number().nonnegative().optional(),
  openingBankBalance: z.coerce.number().nonnegative().optional(),
  alertThreshold: z.coerce.number().nonnegative().optional(),
  criticalThreshold: z.coerce.number().nonnegative().optional(),
  avgCollectionDays: z.coerce.number().int().nonnegative().optional(),
  avgPaymentDays: z.coerce.number().int().nonnegative().optional(),
});

export type UpsertTreasurySettingsInput = z.infer<
  typeof upsertTreasurySettingsSchema
>;

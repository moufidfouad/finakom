import { z } from "zod";

export const upsertSettingsSchema = z.object({
  tvaRatePercent: z.coerce.number().min(0).max(100).optional(),
  quoteValidityDays: z.coerce.number().int().positive().optional(),
  paymentTermsDays: z.coerce.number().int().positive().optional(),
  latePenaltyRatePercent: z.coerce.number().min(0).optional(),
  cashDiscountRatePercent: z.coerce.number().min(0).optional(),
  vatMention: z.string().trim().optional(),
  paymentConditions: z.string().trim().optional(),
  deliveryConditions: z.string().trim().optional(),
  legalMention: z.string().trim().optional(),
  warranty: z.string().trim().optional(),
  bankDetails: z.string().trim().optional(),
});

export type UpsertSettingsInput = z.infer<typeof upsertSettingsSchema>;

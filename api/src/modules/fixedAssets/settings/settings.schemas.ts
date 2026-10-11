import { z } from "zod";

export const upsertFixedAssetSettingsSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100).optional(),
  closingDate: z.coerce.date().optional(),
  corporealThreshold: z.coerce.number().nonnegative().optional(),
  incorporealThreshold: z.coerce.number().nonnegative().optional(),
  degressiveCoefficient: z.coerce.number().positive().optional(),
});

export type UpsertFixedAssetSettingsInput = z.infer<
  typeof upsertFixedAssetSettingsSchema
>;

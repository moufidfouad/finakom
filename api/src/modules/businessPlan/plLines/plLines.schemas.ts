import { z } from "zod";

export const PL_SECTIONS = [
  "ChiffreAffaires",
  "ChargesVariables",
  "ChargesFixes",
  "ChargesPersonnel",
  "ImpotsTaxes",
  "ChargesFinancieres",
  "ImpotSocietes",
] as const;

export const createPLLineSchema = z.object({
  year: z.coerce.number().int().min(1).max(5),
  section: z.enum(PL_SECTIONS),
  label: z.string().trim().min(2, "Le libellé est requis"),
  amount: z.coerce.number(),
});

export const updatePLLineSchema = createPLLineSchema.partial();

export type CreatePLLineInput = z.infer<typeof createPLLineSchema>;
export type UpdatePLLineInput = z.infer<typeof updatePLLineSchema>;

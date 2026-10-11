import { z } from "zod";

export const FUNDING_TYPES = [
  "Apport personnel",
  "Emprunt bancaire",
  "Subvention",
  "Love money",
  "Autre",
] as const;

export const createFundingSchema = z.object({
  type: z.enum(FUNDING_TYPES),
  detail: z.string().trim().min(2, "Le détail est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  notes: z.string().trim().optional(),
});

export const updateFundingSchema = createFundingSchema.partial();

export type CreateFundingInput = z.infer<typeof createFundingSchema>;
export type UpdateFundingInput = z.infer<typeof updateFundingSchema>;

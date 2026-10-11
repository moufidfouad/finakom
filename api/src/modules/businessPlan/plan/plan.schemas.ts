import { z } from "zod";

const narrativeSectionsSchema = z
  .object({
    presentation: z.string().optional(),
    executiveSummary: z.string().optional(),
    organisation: z.string().optional(),
    marketStudy: z.string().optional(),
    pestel: z.string().optional(),
    swot: z.string().optional(),
    competitors: z.string().optional(),
    targetClients: z.string().optional(),
    offerPricing: z.string().optional(),
    strategy: z.string().optional(),
  })
  .partial();

export const createBusinessPlanSchema = z.object({
  title: z.string().trim().min(2, "Le titre est requis"),
  horizonYears: z.coerce.number().int().min(1).max(5).default(3),
});

export const updateBusinessPlanSchema = z.object({
  title: z.string().trim().min(2).optional(),
  status: z.enum(["Brouillon", "Finalisé"]).optional(),
  horizonYears: z.coerce.number().int().min(1).max(5).optional(),
  narrativeSections: narrativeSectionsSchema.optional(),
});

export type CreateBusinessPlanInput = z.infer<typeof createBusinessPlanSchema>;
export type UpdateBusinessPlanInput = z.infer<typeof updateBusinessPlanSchema>;

import { z } from "zod";

export const createInvestmentSchema = z.object({
  category: z.string().trim().min(2, "La catégorie est requise"),
  description: z.string().trim().min(2, "La description est requise"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  notes: z.string().trim().optional(),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;

import { z } from "zod";

export const ASSET_CATEGORIES = [
  "Immobilisations incorporelles",
  "Immobilisations corporelles",
  "Immobilisations financières",
  "Stocks",
  "Créances clients",
  "Créance TVA",
] as const;

export const LIABILITY_CATEGORIES = [
  "Apport personnel",
  "Réserves",
  "Emprunts",
  "Dettes fournisseurs",
  "Dettes fiscales et sociales",
] as const;

export const createBalanceLineSchema = z.object({
  year: z.coerce.number().int().min(1).max(5),
  side: z.enum(["Actif", "Passif"]),
  category: z.string().trim().min(2, "La catégorie est requise"),
  amount: z.coerce.number().nonnegative(),
});

export const updateBalanceLineSchema = createBalanceLineSchema.partial();

export type CreateBalanceLineInput = z.infer<typeof createBalanceLineSchema>;
export type UpdateBalanceLineInput = z.infer<typeof updateBalanceLineSchema>;

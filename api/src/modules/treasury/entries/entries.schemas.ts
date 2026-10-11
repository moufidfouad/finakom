import { z } from "zod";

export const INFLOW_CATEGORIES = [
  "Ventes comptant",
  "Règlements clients",
  "Acomptes reçus",
  "Remboursements TVA",
  "Emprunts reçus",
  "Apports associés",
  "Subventions",
  "Produits financiers",
  "Cessions actifs",
  "Autres encaissements",
] as const;

export const OUTFLOW_CATEGORIES = [
  "Achats fournisseurs",
  "Salaires & charges sociales",
  "CNPS versé",
  "Loyers & charges locatives",
  "TVA versée DGI",
  "IS & Patente",
  "Remboursements emprunts",
  "Investissements & acquisitions",
  "Frais généraux",
  "Publicité & marketing",
  "Autres décaissements",
] as const;

export const TREASURY_CATEGORIES = [
  ...INFLOW_CATEGORIES,
  ...OUTFLOW_CATEGORIES,
] as const;

export const SUPPORTS = [
  "Caisse",
  "Banque",
  "Orange Money",
  "MTN MoMo",
  "Wave",
] as const;

export const createTreasuryEntrySchema = z.object({
  date: z.coerce.date(),
  pieceNumber: z.string().trim().optional(),
  label: z.string().trim().min(2, "Le libellé est requis"),
  category: z.string().trim().min(2, "La catégorie est requise"),
  type: z.enum(["Encaissement", "Décaissement"]),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  support: z.enum(SUPPORTS),
  paymentMethod: z.string().trim().optional(),
  status: z.enum(["Réalisé", "Prévu"]).default("Réalisé"),
  notes: z.string().trim().optional(),
});

export const updateTreasuryEntrySchema = createTreasuryEntrySchema.partial();

export type CreateTreasuryEntryInput = z.infer<
  typeof createTreasuryEntrySchema
>;
export type UpdateTreasuryEntryInput = z.infer<
  typeof updateTreasuryEntrySchema
>;

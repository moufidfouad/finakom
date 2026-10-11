import { z } from "zod";

export const ACCOUNT_ROLES = [
  "CLIENTS",
  "FOURNISSEURS",
  "VENTES_MARCHANDISES",
  "VENTES_SERVICES",
  "ACHATS",
  "TVA_COLLECTEE",
  "TVA_DEDUCTIBLE",
  "BANQUE",
  "CAISSE",
  "CHARGES_PERSONNEL",
  "PERSONNEL_REMUNERATIONS_DUES",
  "ORGANISMES_SOCIAUX",
  "DOTATIONS_AMORTISSEMENTS",
  "AMORTISSEMENTS_CUMULES",
] as const;

export const createAccountSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .min(1, "Le numéro de compte est requis")
    .regex(/^\d+$/, "Le numéro de compte ne doit contenir que des chiffres"),
  label: z.string().trim().min(2, "Le libellé est requis"),
  role: z.enum(ACCOUNT_ROLES).optional(),
});

export const updateAccountSchema = z.object({
  label: z.string().trim().min(2).optional(),
  role: z.enum(ACCOUNT_ROLES).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

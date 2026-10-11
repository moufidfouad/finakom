import { z } from "zod";

export const ASSET_CATEGORIES = [
  "Bâtiment",
  "Matériel transport",
  "Matériel informatique",
  "Mobilier",
  "Outillage",
  "Installation",
  "Logiciel",
  "Terrain",
  "Autre",
] as const;

export const createFixedAssetSchema = z
  .object({
    accountNumber: z
      .string()
      .trim()
      .min(2, "Le numéro de compte SYSCOHADA est requis"),
    acquisitionDate: z.coerce.date(),
    designation: z.string().trim().min(2, "La désignation est requise"),
    category: z.enum(ASSET_CATEGORIES),
    location: z.string().trim().optional(),
    method: z
      .enum(["Linéaire", "Dégressif", "Non amortissable"])
      .default("Linéaire"),
    durationYears: z.coerce.number().int().positive().optional(),
    grossValue: z.coerce
      .number()
      .positive("La valeur brute doit être positive"),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => data.method === "Non amortissable" || !!data.durationYears,
    {
      message:
        "La durée d'amortissement est requise sauf pour un bien non amortissable",
      path: ["durationYears"],
    },
  );

export const updateFixedAssetSchema = z.object({
  accountNumber: z.string().trim().min(2).optional(),
  acquisitionDate: z.coerce.date().optional(),
  designation: z.string().trim().min(2).optional(),
  category: z.enum(ASSET_CATEGORIES).optional(),
  location: z.string().trim().optional(),
  method: z.enum(["Linéaire", "Dégressif", "Non amortissable"]).optional(),
  durationYears: z.coerce.number().int().positive().optional(),
  grossValue: z.coerce.number().positive().optional(),
  notes: z.string().trim().optional(),
});

export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>;
export type UpdateFixedAssetInput = z.infer<typeof updateFixedAssetSchema>;

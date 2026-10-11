import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "Le nom de la société est requis"),
  country: z.string().min(2, "Le pays est requis"),
  currency: z.string().min(2, "La devise est requise"),
  sector: z.string().min(2, "Le secteur d'activité est requis"),
  address: z.string().trim().max(500).optional(),
  accountingSystem: z.enum(["Normal", "SMT"]),
  fiscalRegime: z.string().min(2, "Le régime fiscal est requis"),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

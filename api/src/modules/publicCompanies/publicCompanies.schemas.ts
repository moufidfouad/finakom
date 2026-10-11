import { z } from "zod";

export const listPublicCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().min(1).optional(),
  sector: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
});

export type ListPublicCompaniesQuery = z.infer<
  typeof listPublicCompaniesQuerySchema
>;

export const updateDirectorySettingsSchema = z.object({
  directoryVisibility: z.enum(["Brouillon", "Public"]),
  publicDescription: z.string().trim().max(3000).optional(),
});

export type UpdateDirectorySettingsInput = z.infer<
  typeof updateDirectorySettingsSchema
>;

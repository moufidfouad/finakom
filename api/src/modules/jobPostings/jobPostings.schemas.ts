import { z } from "zod";
import { CV_SKILL_LEVELS } from "@/modules/cv/cv.schemas";

const desiredSkillSchema = z.object({
  title: z.string().trim().min(1, "Le nom de la compétence est requis"),
  level: z.enum(CV_SKILL_LEVELS),
});

export const createJobPostingSchema = z.object({
  title: z.string().min(2, "L'intitulé du poste est requis"),
  description: z.string().min(10, "La description est requise"),
  location: z.string().optional(),
  contractType: z.string().min(2, "Le type de contrat est requis"),
  desiredExperienceYears: z.coerce.number().int().min(0).max(60).optional(),
  desiredSkills: z.array(desiredSkillSchema).default([]),
});

export const updateJobPostingSchema = createJobPostingSchema;

export const updateJobPostingStatusSchema = z.object({
  status: z.enum(["Ouverte", "Fermée"]),
});

export const listPublicJobPostingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().min(1).optional(),
  contractType: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  companyId: z.string().uuid().optional(),
  skill: z.string().trim().min(1).optional(),
  minExperience: z.coerce.number().int().min(0).optional(),
});

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
export type UpdateJobPostingStatusInput = z.infer<
  typeof updateJobPostingStatusSchema
>;
export type ListPublicJobPostingsQuery = z.infer<
  typeof listPublicJobPostingsQuerySchema
>;

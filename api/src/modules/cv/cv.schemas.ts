import { z } from "zod";

export const CV_SKILL_LEVELS = [
  "Débutant",
  "Intermédiaire",
  "Avancé",
  "Expert",
] as const;

const educationSchema = z.object({
  degree: z.string().min(2, "Le diplôme est requis"),
  school: z.string().min(2, "L'établissement est requis"),
  startYear: z.coerce.number().int().min(1950).max(2100),
  endYear: z.coerce.number().int().min(1950).max(2100).nullable().optional(),
});

const experienceSchema = z.object({
  title: z.string().min(2, "Le poste est requis"),
  company: z.string().min(2, "L'entreprise est requise"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  description: z.string().max(2000).optional(),
});

const skillSchema = z.object({
  title: z.string().min(1, "Le nom de la compétence est requis"),
  level: z.enum(CV_SKILL_LEVELS),
  specificities: z.array(z.string().trim().min(1)).default([]),
});

const languageSchema = z.object({
  name: z.string().min(1, "Le nom de la langue est requis"),
  level: z.enum(CV_SKILL_LEVELS),
});

export const createCvSchema = z.object({
  title: z.string().min(2, "L'intitulé recherché est requis"),
  summary: z.string().max(2000).optional(),
  educations: z.array(educationSchema).default([]),
  experiences: z.array(experienceSchema).default([]),
  skills: z.array(skillSchema).default([]),
  languages: z.array(languageSchema).default([]),
  permits: z.array(z.string().trim().min(1)).default([]),
  interests: z.array(z.string().trim().min(1)).default([]),
});

export const updateCvSchema = createCvSchema;

export const updateCvVisibilitySchema = z.object({
  visibility: z.enum(["Brouillon", "Public"]),
  template: z
    .enum(["classique", "moderne", "compact", "chronologique", "deux-colonnes"])
    .optional(),
  showFullName: z.boolean().optional(),
  showPhoto: z.boolean().optional(),
  showPhone: z.boolean().optional(),
});

export type CreateCvInput = z.infer<typeof createCvSchema>;
export type UpdateCvInput = z.infer<typeof updateCvSchema>;
export type UpdateCvVisibilityInput = z.infer<typeof updateCvVisibilitySchema>;

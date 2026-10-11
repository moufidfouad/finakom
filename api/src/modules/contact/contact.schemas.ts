import { z } from "zod";

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom est requis (2 caractères minimum)"),
  email: z.string().trim().email("Email invalide"),
  subject: z.string().trim().min(3, "Le sujet est requis"),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000),
  website: z.string().max(0, "Requête invalide").optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

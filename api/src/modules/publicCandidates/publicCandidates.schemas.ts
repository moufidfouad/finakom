import { z } from "zod";

export const contactCandidateSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(2, "Le nom est requis (2 caractères minimum)"),
  senderEmail: z.string().trim().email("Email invalide"),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000),
  // Honeypot anti-spam — même principe que contact.schemas.ts : un champ
  // invisible pour un humain, qu'un bot remplit presque toujours.
  website: z.string().max(0, "Requête invalide").optional().or(z.literal("")),
});

export type ContactCandidateInput = z.infer<typeof contactCandidateSchema>;

export const listPublicCvsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().min(1).optional(),
  skill: z.string().trim().min(1).optional(),
});

export type ListPublicCvsQuery = z.infer<typeof listPublicCvsQuerySchema>;

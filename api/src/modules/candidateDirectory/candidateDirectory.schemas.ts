import { z } from "zod";

export const contactCandidateSchema = z.object({
  senderName: z.string().min(2, "Votre nom est requis").max(200),
  senderEmail: z.string().email("Email invalide"),
  message: z.string().min(10, "Le message est requis").max(3000),
});

export type ContactCandidateInput = z.infer<typeof contactCandidateSchema>;

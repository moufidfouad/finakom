import { z } from "zod";

// Créer un membre = créer (ou rattacher, si l'email existe déjà) un utilisateur
// à l'entreprise. Le mot de passe n'est requis que pour un email inédit.
export const createMemberSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  fullName: z.string().trim().min(2, "Le nom complet est requis").optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .optional(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

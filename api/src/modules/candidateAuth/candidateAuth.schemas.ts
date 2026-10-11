import { z } from "zod";

export const candidateRegisterSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  fullName: z.string().min(2, "Le nom complet est requis"),
  phone: z.string().min(6).optional(),
});

export const candidateGoogleAuthSchema = z.object({
  idToken: z.string().min(10, "Jeton Google manquant"),
});

export const candidateLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const candidateChangePasswordSchema = z.object({
  // Optionnel : un compte créé via Google n'a pas encore de mot de passe local —
  // dans ce cas il n'y a rien à vérifier, le candidat en définit un pour la première fois.
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const candidateForgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const candidateRequestVerificationResendSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const candidateResetPasswordSchema = z.object({
  token: z.string().min(10, "Jeton manquant"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const candidateVerifyEmailSchema = z.object({
  token: z.string().min(10, "Jeton manquant"),
});

export type CandidateRegisterInput = z.infer<typeof candidateRegisterSchema>;
export type CandidateGoogleAuthInput = z.infer<
  typeof candidateGoogleAuthSchema
>;
export type CandidateLoginInput = z.infer<typeof candidateLoginSchema>;
export type CandidateChangePasswordInput = z.infer<
  typeof candidateChangePasswordSchema
>;
export type CandidateForgotPasswordInput = z.infer<
  typeof candidateForgotPasswordSchema
>;
export type CandidateResetPasswordInput = z.infer<
  typeof candidateResetPasswordSchema
>;
export type CandidateVerifyEmailInput = z.infer<
  typeof candidateVerifyEmailSchema
>;

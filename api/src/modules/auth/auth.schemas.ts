import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  fullName: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, "Jeton Google manquant"),
});

export const changePasswordSchema = z.object({
  // Optionnel : un compte créé via Google n'a pas encore de mot de passe local —
  // dans ce cas il n'y a rien à vérifier, l'utilisateur en définit un pour la première fois.
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const requestVerificationResendSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Jeton manquant"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "Jeton manquant"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

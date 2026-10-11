import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  COOKIE_ACCESS_NAME: z.string().min(10),
  COOKIE_REFRESH_NAME: z.string().min(10),
  COOKIE_CSRF_NAME: z.string().min(10),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CANDIDATE_JWT_ACCESS_SECRET: z.string().min(10),
  CANDIDATE_JWT_REFRESH_SECRET: z.string().min(10),
  CANDIDATE_COOKIE_ACCESS_NAME: z.string().min(10),
  CANDIDATE_COOKIE_REFRESH_NAME: z.string().min(10),
  CANDIDATE_COOKIE_CSRF_NAME: z.string().min(10),

  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  BACKEND_URL: z
    .string()
    .default(`http://localhost:${process.env.PORT || 4000}`),
  API_V1_URL: z.string().default("api"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Répertoire de stockage des fichiers uploadés (logos d'entreprise...), servi
  // statiquement sous /uploads. Chemin relatif au répertoire de travail du process.
  UPLOADS_DIR: z.string().default("uploads"),
  // URL publique du frontend — utilisée pour construire les liens dans les emails
  // (vérification, réinitialisation de mot de passe).
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  SMTP_USER: z.string().optional(), // adresse Gmail expéditrice
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  // Adresse Gmail qui reçoit les messages du formulaire de contact — par défaut
  // la même adresse que celle utilisée pour l'envoi (SMTP_USER).
  CONTACT_EMAIL: z.string().optional(),
  // OAuth Google (Google Cloud Console) — même Client ID réutilisé pour la
  // connexion "Se connecter avec Google" (vérification de jeton d'identité) ET
  // pour l'envoi d'emails via l'API Gmail (avec GOOGLE_CLIENT_SECRET ci-dessus).
  // Optionnel : si absent, la connexion Google est simplement désactivée côté API.
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Variables d'environnement invalides :",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;

if (!env.SMTP_USER || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
  console.warn(
    "⚠️  Envoi d'emails désactivé (SMTP_USER / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN manquants) — vérification, réinitialisation, contact ne partiront pas.",
  );
}
if (!env.GOOGLE_CLIENT_ID) {
  console.warn(
    "⚠️  GOOGLE_CLIENT_ID non configuré — connexion Google désactivée.",
  );
}

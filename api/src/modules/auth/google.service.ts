import { OAuth2Client } from "google-auth-library";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";

const client = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  fullName: string | null;
}

/**
 * Vérifie le jeton d'identité (ID token) émis par Google Identity Services côté
 * frontend, directement auprès de Google — jamais fait confiance à un payload
 * décodé côté client sans vérification de signature.
 */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile> {
  if (!client) {
    throw AppError.badRequest(
      "La connexion Google n'est pas configurée sur ce serveur.",
    );
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw AppError.unauthorized("Jeton Google invalide ou expiré.");
  }

  if (!payload?.sub || !payload.email) {
    throw AppError.unauthorized("Jeton Google invalide.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    fullName: payload.name ?? null,
  };
}

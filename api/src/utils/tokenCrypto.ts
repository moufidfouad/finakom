import crypto from "crypto";

/**
 * Fonctions cryptographiques PURES (aucune dépendance à Prisma/la base), pour
 * rester testables en isolation — voir verificationToken.ts pour les fonctions
 * qui persistent ces jetons en base.
 */

/** Jamais de jeton brut en base — même principe que les mots de passe : si la
 * base fuite, un jeton haché n'est pas directement exploitable. */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

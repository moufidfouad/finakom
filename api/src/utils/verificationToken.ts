import { prisma } from "@/config/prisma";
import { AppError } from "./AppError";
import { generateRawToken, hashToken } from "./tokenCrypto";

export type VerificationTokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

const TTL_MS: Record<VerificationTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
};

/** Crée un jeton, invalide les jetons du même type déjà émis pour cet
 * utilisateur (un seul jeton actif à la fois évite la confusion "quel lien est
 * le bon"), et retourne le jeton BRUT à insérer dans l'email — jamais stocké tel quel. */
export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType,
): Promise<string> {
  const rawToken = generateRawToken();
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { userId, type } }),
    prisma.verificationToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + TTL_MS[type]),
      },
    }),
  ]);
  return rawToken;
}

/** Valide et consomme (usage unique) un jeton. Lève une erreur claire si absent,
 * expiré, ou de mauvais type — jamais de détail permettant de deviner un jeton valide. */
export async function consumeVerificationToken(
  rawToken: string,
  type: VerificationTokenType,
): Promise<string> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.type !== type) {
    throw AppError.badRequest("Lien invalide ou déjà utilisé.");
  }
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } });
    throw AppError.badRequest(
      "Ce lien a expiré. Merci de refaire une demande.",
    );
  }

  await prisma.verificationToken.delete({ where: { id: record.id } });
  return record.userId;
}

import { prisma } from '@/config/prisma';
import { AppError } from './AppError';
import { generateRawToken, hashToken } from './tokenCrypto';

export type CandidateVerificationTokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

const TTL_MS: Record<CandidateVerificationTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
};

/**
 * Réplique verificationToken.ts (espace entreprise), mais sur
 * CandidateVerificationToken — VerificationToken.userId a une clé étrangère
 * stricte vers User, impossible à réutiliser pour un candidateId sans la
 * casser, d'où cette table et ces fonctions dédiées à l'espace candidat.
 */
export async function createCandidateVerificationToken(candidateId: string, type: CandidateVerificationTokenType): Promise<string> {
  const rawToken = generateRawToken();
  await prisma.$transaction([
    prisma.candidateVerificationToken.deleteMany({ where: { candidateId, type } }),
    prisma.candidateVerificationToken.create({
      data: { candidateId, type, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + TTL_MS[type]) },
    }),
  ]);
  return rawToken;
}

export async function consumeCandidateVerificationToken(rawToken: string, type: CandidateVerificationTokenType): Promise<string> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.candidateVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type) {
    throw AppError.badRequest('Lien invalide ou déjà utilisé.');
  }
  if (record.expiresAt < new Date()) {
    await prisma.candidateVerificationToken.delete({ where: { id: record.id } });
    throw AppError.badRequest('Ce lien a expiré. Merci de refaire une demande.');
  }

  await prisma.candidateVerificationToken.delete({ where: { id: record.id } });
  return record.candidateId;
}

import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/config/prisma';
import { AppError } from '@/utils/AppError';
import { CANDIDATE_PHOTOS_DIR, resolveUploadPath } from '@/config/uploads';

const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Supprime une éventuelle photo précédente (extension potentiellement
 * différente du nouveau fichier) avant d'écrire la remplaçante — même
 * patron que deleteExistingLogoFile côté entreprise. */
async function deleteExistingPhotoFile(candidateId: string) {
  const files = await fs.readdir(CANDIDATE_PHOTOS_DIR).catch(() => [] as string[]);
  const existing = files.find((f) => f.startsWith(`${candidateId}.`));
  if (existing) await fs.unlink(path.join(CANDIDATE_PHOTOS_DIR, existing)).catch(() => {});
}

/** Pas de vérification d'appartenance ici, contrairement à uploadCompanyLogo
 * — un candidat authentifié est toujours propriétaire de sa propre photo par
 * construction (candidateId vient de req.candidate, jamais d'un paramètre
 * d'URL arbitraire), pas de notion d'appartenance à vérifier comme pour une
 * entreprise à laquelle plusieurs utilisateurs peuvent appartenir. */
export async function uploadCandidatePhoto(candidateId: string, file: Express.Multer.File) {
  const extension = EXTENSION_BY_MIMETYPE[file.mimetype];
  if (!extension) {
    throw AppError.badRequest('Format d\'image non supporté — utilisez PNG, JPEG ou WebP.');
  }

  await deleteExistingPhotoFile(candidateId);

  const relativePath = `candidate-photos/${candidateId}.${extension}`;
  await fs.writeFile(resolveUploadPath(relativePath), file.buffer);

  return prisma.candidate.update({ where: { id: candidateId }, data: { photoUrl: relativePath } });
}

export async function deleteCandidatePhoto(candidateId: string) {
  await deleteExistingPhotoFile(candidateId);
  return prisma.candidate.update({ where: { id: candidateId }, data: { photoUrl: null } });
}

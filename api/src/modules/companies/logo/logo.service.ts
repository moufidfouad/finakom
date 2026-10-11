import fs from "fs/promises";
import path from "path";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { LOGOS_DIR, resolveUploadPath } from "@/config/uploads";

const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Supprime un éventuel logo précédent (extension potentiellement différente
 * du nouveau fichier) avant d'écrire le remplaçant. */
async function deleteExistingLogoFile(companyId: string) {
  const files = await fs.readdir(LOGOS_DIR).catch(() => [] as string[]);
  const existing = files.find((f) => f.startsWith(`${companyId}.`));
  if (existing) await fs.unlink(path.join(LOGOS_DIR, existing)).catch(() => {});
}

export async function uploadCompanyLogo(
  companyId: string,
  auth: AuthenticatedUser,
  file: Express.Multer.File,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const extension = EXTENSION_BY_MIMETYPE[file.mimetype];
  if (!extension) {
    throw AppError.badRequest(
      "Format d'image non supporté — utilisez PNG, JPEG ou WebP.",
    );
  }

  await deleteExistingLogoFile(companyId);

  const relativePath = `logos/${companyId}.${extension}`;
  await fs.writeFile(resolveUploadPath(relativePath), file.buffer);

  return prisma.company.update({
    where: { id: companyId },
    data: { logoUrl: relativePath },
  });
}

export async function deleteCompanyLogo(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await deleteExistingLogoFile(companyId);
  return prisma.company.update({
    where: { id: companyId },
    data: { logoUrl: null },
  });
}

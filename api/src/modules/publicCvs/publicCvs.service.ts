import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";

/** Sélection volontairement restrictive : jamais email ni téléphone, même
 * ici côté backend pour cet endpoint précis — l'annuaire est accessible à
 * n'importe quel visiteur du site public, sans authentification. Exposer
 * les coordonnées en clair faciliterait leur moissonnage automatisé. */
const PUBLIC_CV_INCLUDE = {
  candidate: { select: { id: true, fullName: true } },
  educations: { orderBy: { startYear: "desc" as const } },
  experiences: { orderBy: { startDate: "desc" as const } },
};

export async function listPublicCvs() {
  return prisma.candidateCv.findMany({
    where: { visibility: "Public" },
    include: PUBLIC_CV_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPublicCv(cvId: string) {
  const cv = await prisma.candidateCv.findFirst({
    where: { id: cvId, visibility: "Public" },
    include: PUBLIC_CV_INCLUDE,
  });
  if (!cv) throw AppError.notFound("CV introuvable");
  return cv;
}

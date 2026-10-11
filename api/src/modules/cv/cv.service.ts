import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import {
  CreateCvInput,
  UpdateCvInput,
  UpdateCvVisibilityInput,
} from "./cv.schemas";

const CV_INCLUDE = {
  educations: { orderBy: { startYear: "desc" as const } },
  experiences: { orderBy: { startDate: "desc" as const } },
  skills: true,
  languages: true,
};

/** Vérifie que le CV appartient bien au candidat courant — jamais un candidat
 * ne doit pouvoir lire ou modifier le CV d'un autre. Même principe que
 * getOwnedDocumentOrThrow côté entreprise, adapté à l'espace candidat. */
async function getOwnedCvOrThrow(cvId: string, candidateId: string) {
  const cv = await prisma.candidateCv.findFirst({
    where: { id: cvId, candidateId },
    include: CV_INCLUDE,
  });
  if (!cv) throw AppError.notFound("CV introuvable");
  return cv;
}

export async function listCvs(candidateId: string) {
  return prisma.candidateCv.findMany({
    where: { candidateId },
    include: CV_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCv(cvId: string, candidateId: string) {
  return getOwnedCvOrThrow(cvId, candidateId);
}

export async function createCv(candidateId: string, input: CreateCvInput) {
  return prisma.candidateCv.create({
    data: {
      candidateId,
      title: input.title,
      summary: input.summary,
      permits: input.permits,
      interests: input.interests,
      educations: { create: input.educations },
      experiences: { create: input.experiences },
      skills: { create: input.skills },
      languages: { create: input.languages },
    },
    include: CV_INCLUDE,
  });
}

/** Remplace intégralement les formations/expériences (supprime puis recrée)
 * plutôt qu'un diff fin grain — un CV compte au plus quelques lignes de
 * chaque, un remplacement complet reste simple à raisonner et à tester. */
export async function updateCv(
  cvId: string,
  candidateId: string,
  input: UpdateCvInput,
) {
  await getOwnedCvOrThrow(cvId, candidateId);

  return prisma.$transaction(async (tx) => {
    await tx.cvEducation.deleteMany({ where: { cvId } });
    await tx.cvExperience.deleteMany({ where: { cvId } });
    await tx.cvSkill.deleteMany({ where: { cvId } });
    await tx.cvLanguage.deleteMany({ where: { cvId } });
    return tx.candidateCv.update({
      where: { id: cvId },
      data: {
        title: input.title,
        summary: input.summary,
        permits: input.permits,
        interests: input.interests,
        educations: { create: input.educations },
        experiences: { create: input.experiences },
        skills: { create: input.skills },
        languages: { create: input.languages },
      },
      include: CV_INCLUDE,
    });
  });
}

export async function updateCvVisibility(
  cvId: string,
  candidateId: string,
  input: UpdateCvVisibilityInput,
) {
  await getOwnedCvOrThrow(cvId, candidateId);
  return prisma.candidateCv.update({
    where: { id: cvId },
    data: input,
    include: CV_INCLUDE,
  });
}

export async function deleteCv(cvId: string, candidateId: string) {
  await getOwnedCvOrThrow(cvId, candidateId);
  await prisma.candidateCv.delete({ where: { id: cvId } });
}

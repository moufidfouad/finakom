import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { sendCandidateContactEmail } from "@/modules/email/email.service";
import { getIO, isIOReady } from "@/realtime/io";
import { emitCandidateNotificationsChanged } from "@/realtime/notificationsSocket";
import {
  ContactCandidateInput,
  ListPublicCvsQuery,
} from "./publicCandidates.schemas";

/**
 * SÉLECTION STRICTE des champs Candidate exposés publiquement — jamais
 * `include: { candidate: true }` (exposerait passwordHash, email). photoUrl
 * et phone sont ici récupérés bruts, PUIS explicitement masqués par
 * applyPersonalInfoVisibility ci-dessous selon les préférences du candidat —
 * jamais court-circuité par un select conditionnel Prisma, qui serait plus
 * difficile à auditer qu'une fonction de masquage explicite et centralisée.
 * L'email ne transite JAMAIS vers le client, quelle que soit la préférence
 * (voir sendCandidateContactEmail pour le mécanisme de contact qui le
 * contourne sans l'exposer — aucune préférence ne peut désactiver cette
 * protection, elle n'est même pas une option proposée au candidat).
 */
const PUBLIC_CV_INCLUDE = {
  candidate: { select: { fullName: true, photoUrl: true, phone: true } },
  educations: { orderBy: { startYear: "desc" as const } },
  experiences: { orderBy: { startDate: "desc" as const } },
  skills: true,
  languages: true,
};

type CvWithCandidate = {
  showFullName: boolean;
  showPhoto: boolean;
  showPhone: boolean;
  candidate: {
    fullName: string;
    photoUrl: string | null;
    phone: string | null;
  };
};

/** Applique les préférences de visibilité du candidat sur les champs
 * personnels — appelée sur CHAQUE CV avant de quitter le service, jamais
 * optionnelle, pour qu'aucun point d'entrée (liste, détail) ne puisse
 * oublier de l'appliquer. */
function applyPersonalInfoVisibility<T extends CvWithCandidate>(cv: T): T {
  return {
    ...cv,
    candidate: {
      ...cv.candidate,
      fullName: cv.showFullName ? cv.candidate.fullName : "Candidat",
      photoUrl: cv.showPhoto ? cv.candidate.photoUrl : null,
      phone: cv.showPhone ? cv.candidate.phone : null,
    },
  };
}

export async function listPublicCvs(query: ListPublicCvsQuery) {
  const where = {
    visibility: "Public" as const,
    ...(query.skill && {
      skills: {
        some: { title: { equals: query.skill, mode: "insensitive" as const } },
      },
    }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        { summary: { contains: query.search, mode: "insensitive" as const } },
        {
          candidate: {
            fullName: { contains: query.search, mode: "insensitive" as const },
          },
        },
        {
          skills: {
            some: {
              title: { contains: query.search, mode: "insensitive" as const },
            },
          },
        },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.candidateCv.findMany({
      where,
      include: PUBLIC_CV_INCLUDE,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.candidateCv.count({ where }),
  ]);

  return {
    items: items.map(applyPersonalInfoVisibility),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Compétences distinctes réellement présentes parmi les CV publics — peuple
 * le filtre côté client sans jamais proposer une compétence qui ne
 * ramènerait aucun résultat. */
export async function getPublicCvFacets() {
  const skills = await prisma.cvSkill.findMany({
    where: { cv: { visibility: "Public" } },
    select: { title: true },
    distinct: ["title"],
  });
  return { skills: skills.map((s: { title: string }) => s.title).sort() };
}

export async function getPublicCv(cvId: string) {
  const cv = await prisma.candidateCv.findFirst({
    where: { id: cvId, visibility: "Public" },
    include: PUBLIC_CV_INCLUDE,
  });
  if (!cv) throw AppError.notFound("CV introuvable");
  return applyPersonalInfoVisibility(cv);
}

/**
 * Relaie un message vers le VRAI email du candidat (récupéré ici, côté
 * serveur, jamais transmis au client) — c'est le mécanisme qui permet à un
 * visiteur de contacter un candidat sans jamais voir son adresse email.
 * Crée aussi une notification in-app, pour que le candidat voie le message
 * dans son espace même s'il ne consulte pas ses emails immédiatement.
 */
export async function contactCandidateViaCv(
  cvId: string,
  input: ContactCandidateInput,
) {
  const cv = await prisma.candidateCv.findFirst({
    where: { id: cvId, visibility: "Public" },
    include: {
      candidate: { select: { id: true, email: true, fullName: true } },
    },
  });
  if (!cv) throw AppError.notFound("CV introuvable");

  await sendCandidateContactEmail(
    cv.candidate.email,
    cv.candidate.fullName,
    cv.title,
    input.senderName,
    input.senderEmail,
    input.message,
  );

  await prisma.candidateContactNotification.create({
    data: {
      candidateId: cv.candidate.id,
      cvId: cv.id,
      cvTitle: cv.title,
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      message: input.message,
    },
  });

  if (isIOReady()) emitCandidateNotificationsChanged(getIO(), cv.candidate.id);
}

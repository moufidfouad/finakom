import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { createNotificationForApplication } from "@/modules/companyNotifications/companyNotifications.service";
import {
  CreateJobApplicationInput,
  UpdateJobApplicationStatusInput,
} from "./jobApplications.schemas";

// ---------- Espace candidat ----------

/**
 * Soumet une candidature — cvSnapshot capture le contenu du CV CHOISI au
 * moment T (décision produit explicite) : si le candidat modifie ensuite ce
 * CV, l'entreprise doit continuer à voir exactement ce qui a été soumis à
 * l'origine, jamais une version dérivée. Une seule candidature par candidat
 * et par offre (contrainte unique en base) — vérifié explicitement avant
 * création plutôt que de compter sur l'erreur Prisma, cohérent avec le style
 * déjà établi (registerCandidate vérifie l'email avant de créer).
 */
export async function createJobApplication(
  jobPostingId: string,
  candidateId: string,
  input: CreateJobApplicationInput,
) {
  const posting = await prisma.jobPosting.findFirst({
    where: { id: jobPostingId, status: "Ouverte" },
  });
  if (!posting) throw AppError.notFound("Offre introuvable");

  const cv = await prisma.candidateCv.findFirst({
    where: { id: input.cvId, candidateId },
    include: { educations: true, experiences: true, skills: true },
  });
  if (!cv) throw AppError.notFound("CV introuvable");

  const existing = await prisma.jobApplication.findUnique({
    where: { jobPostingId_candidateId: { jobPostingId, candidateId } },
  });
  if (existing)
    throw AppError.conflict("Vous avez déjà postulé à cette offre.");

  const application = await prisma.jobApplication.create({
    // JSON.parse(JSON.stringify(...)) plutôt qu'un cast direct : cv contient
    // des objets Date (startDate/endDate des expériences), qui ne sont pas du
    // JSON pur — cette sérialisation explicite les convertit en chaînes ISO,
    // garantissant un snapshot cohérent plutôt que de compter sur une
    // conversion implicite incertaine du driver Prisma pour le type Json.
    data: {
      jobPostingId,
      candidateId,
      cvSnapshot: JSON.parse(JSON.stringify(cv)),
    },
  });

  // Fire-and-forget, même principe que createNotificationsForJobPosting côté
  // candidat : ne doit jamais faire attendre la confirmation de candidature.
  createNotificationForApplication(application.id).catch((err) => {
    console.error(
      `❌ Échec de la notification entreprise pour la candidature ${application.id} :`,
      err,
    );
  });

  return application;
}

export async function listCandidateApplications(candidateId: string) {
  return prisma.jobApplication.findMany({
    where: { candidateId },
    include: {
      jobPosting: {
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ---------- Espace entreprise ----------

async function getOwnedJobApplicationOrThrow(
  applicationId: string,
  auth: AuthenticatedUser,
) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { jobPosting: true },
  });
  if (!application) throw AppError.notFound("Candidature introuvable");
  await getMemberCompanyOrThrow(application.jobPosting.companyId, auth);
  return application;
}

export async function listApplicationsForJobPosting(
  jobPostingId: string,
  auth: AuthenticatedUser,
) {
  const posting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
  });
  if (!posting) throw AppError.notFound("Offre introuvable");
  await getMemberCompanyOrThrow(posting.companyId, auth);

  return prisma.jobApplication.findMany({
    where: { jobPostingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateJobApplicationStatus(
  applicationId: string,
  auth: AuthenticatedUser,
  input: UpdateJobApplicationStatusInput,
) {
  await getOwnedJobApplicationOrThrow(applicationId, auth);
  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: input.status },
  });
}

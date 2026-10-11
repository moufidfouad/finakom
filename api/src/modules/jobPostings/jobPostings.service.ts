import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { assertCanModifyOwnedResource } from "@/utils/resourceOwnership";
import { createNotificationsForJobPosting } from "@/modules/candidateNotifications/candidateNotifications.service";
import {
  CreateJobPostingInput,
  ListPublicJobPostingsQuery,
  UpdateJobPostingInput,
  UpdateJobPostingStatusInput,
} from "./jobPostings.schemas";

async function getOwnedJobPostingOrThrow(
  jobPostingId: string,
  auth: AuthenticatedUser,
) {
  const posting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
  });
  if (!posting) throw AppError.notFound("Offre introuvable");
  await getMemberCompanyOrThrow(posting.companyId, auth);
  return posting;
}

async function assertCanModifyJobPosting(
  posting: { companyId: string; createdById: string | null },
  auth: AuthenticatedUser,
) {
  await assertCanModifyOwnedResource(posting, auth, {
    errorMessage:
      "Seul le créateur de cette offre, un administrateur de l'entreprise, ou le super-administrateur peut la modifier.",
  });
}

// ---------- Espace entreprise (authentifié, membre de l'entreprise) ----------

export async function listJobPostingsForCompany(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.jobPosting.findMany({
    where: { companyId },
    include: {
      _count: { select: { applications: true } },
      desiredSkills: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobPostingForCompany(
  jobPostingId: string,
  auth: AuthenticatedUser,
) {
  const posting = await getOwnedJobPostingOrThrow(jobPostingId, auth);
  return prisma.jobPosting.findUnique({
    where: { id: posting.id },
    include: {
      _count: { select: { applications: true } },
      desiredSkills: true,
    },
  });
}

export async function createJobPosting(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateJobPostingInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const { desiredSkills, ...postingFields } = input;
  const posting = await prisma.jobPosting.create({
    data: {
      companyId,
      createdById: auth.userId,
      ...postingFields,
      desiredSkills: { create: desiredSkills },
    },
  });

  // Fire-and-forget : cible potentiellement tous les CV publics de la
  // plateforme, ne doit jamais faire attendre la réponse à l'entreprise.
  // Compromis MVP en l'absence de file de tâches dans ce projet — à migrer
  // vers une vraie queue si le volume de CV publics grandit significativement.
  createNotificationsForJobPosting(posting.id).catch((err) => {
    console.error(
      `❌ Échec du ciblage de notifications pour l'offre ${posting.id} :`,
      err,
    );
  });

  return posting;
}

export async function updateJobPosting(
  jobPostingId: string,
  auth: AuthenticatedUser,
  input: UpdateJobPostingInput,
) {
  const posting = await getOwnedJobPostingOrThrow(jobPostingId, auth);
  await assertCanModifyJobPosting(posting, auth);
  const { desiredSkills, ...postingFields } = input;

  return prisma.$transaction(async (tx) => {
    await tx.jobPostingSkill.deleteMany({ where: { jobPostingId } });
    return tx.jobPosting.update({
      where: { id: jobPostingId },
      data: { ...postingFields, desiredSkills: { create: desiredSkills } },
    });
  });
}

export async function updateJobPostingStatus(
  jobPostingId: string,
  auth: AuthenticatedUser,
  input: UpdateJobPostingStatusInput,
) {
  const posting = await getOwnedJobPostingOrThrow(jobPostingId, auth);
  await assertCanModifyJobPosting(posting, auth);
  return prisma.jobPosting.update({
    where: { id: jobPostingId },
    data: { status: input.status },
  });
}

export async function deleteJobPosting(
  jobPostingId: string,
  auth: AuthenticatedUser,
) {
  const posting = await getOwnedJobPostingOrThrow(jobPostingId, auth);
  await assertCanModifyJobPosting(posting, auth);
  await prisma.jobPosting.delete({ where: { id: jobPostingId } });
}

// ---------- Espace public (aucune authentification) ----------
// Seules les offres "Ouverte" sont exposées — une offre fermée ne doit jamais
// être visible publiquement, y compris par son URL directe (404, pas juste
// masquée dans la liste).

export async function listPublicJobPostings(query: ListPublicJobPostingsQuery) {
  const where = {
    status: "Ouverte" as const,
    ...(query.contractType && { contractType: query.contractType }),
    ...(query.location && {
      location: { contains: query.location, mode: "insensitive" as const },
    }),
    ...(query.companyId && { companyId: query.companyId }),
    ...(query.minExperience !== undefined && {
      desiredExperienceYears: { gte: query.minExperience },
    }),
    ...(query.skill && {
      desiredSkills: {
        some: { title: { equals: query.skill, mode: "insensitive" as const } },
      },
    }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        {
          description: { contains: query.search, mode: "insensitive" as const },
        },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        desiredSkills: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.jobPosting.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Valeurs distinctes réellement présentes parmi les offres ouvertes — peuple
 * les options de filtre côté client sans jamais proposer une valeur qui ne
 * ramènerait aucun résultat. */
export async function getPublicJobPostingFacets() {
  const openPostings = await prisma.jobPosting.findMany({
    where: { status: "Ouverte" },
    select: { contractType: true, location: true },
  });
  const openPostingSkills = await prisma.jobPostingSkill.findMany({
    where: { jobPosting: { status: "Ouverte" } },
    select: { title: true },
    distinct: ["title"],
  });

  const contractTypes = [
    ...new Set(
      openPostings.map((p: { contractType: string }) => p.contractType),
    ),
  ].sort();
  const locations = [
    ...new Set(
      openPostings
        .map((p: { location: string | null }) => p.location)
        .filter((l: string | null): l is string => !!l),
    ),
  ].sort();
  const skills = openPostingSkills
    .map((s: { title: string }) => s.title)
    .sort();

  return { contractTypes, locations, skills };
}

export async function getPublicJobPosting(jobPostingId: string) {
  const posting = await prisma.jobPosting.findFirst({
    where: { id: jobPostingId, status: "Ouverte" },
    include: {
      company: { select: { id: true, name: true, logoUrl: true } },
      desiredSkills: true,
    },
  });
  if (!posting) throw AppError.notFound("Offre introuvable");
  return posting;
}

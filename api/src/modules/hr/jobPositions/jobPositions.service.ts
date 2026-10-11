import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { ownerWhereNested } from "@/utils/authContext";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import {
  CreateJobPositionInput,
  UpdateJobPositionInput,
} from "./jobPositions.schemas";

export async function getOwnedJobPositionOrThrow(
  jobPositionId: string,
  auth: AuthenticatedUser,
) {
  const jobPosition = await prisma.jobPosition.findFirst({
    where: { id: jobPositionId, ...ownerWhereNested(auth) },
  });
  if (!jobPosition) throw AppError.notFound("Poste introuvable");
  return jobPosition;
}

export async function listJobPositions(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.jobPosition.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
}

export async function createJobPosition(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateJobPositionInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const existing = await prisma.jobPosition.findFirst({
    where: { companyId, code: input.code },
  });
  if (existing)
    throw AppError.conflict(
      `Le code poste "${input.code}" existe déjà pour cette entreprise`,
    );
  return prisma.jobPosition.create({ data: { ...input, companyId } });
}

export async function updateJobPosition(
  jobPositionId: string,
  auth: AuthenticatedUser,
  input: UpdateJobPositionInput,
) {
  await getOwnedJobPositionOrThrow(jobPositionId, auth);
  return prisma.jobPosition.update({
    where: { id: jobPositionId },
    data: input,
  });
}

export async function deleteJobPosition(
  jobPositionId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedJobPositionOrThrow(jobPositionId, auth);
  await prisma.jobPosition.delete({ where: { id: jobPositionId } });
}

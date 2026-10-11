import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { ownerWhereNested } from "@/utils/authContext";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { CreateAnalysisInput, UpdateAnalysisInput } from "./analyses.schemas";

export async function getOwnedAnalysisOrThrow(
  analysisId: string,
  auth: AuthenticatedUser,
) {
  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, ...ownerWhereNested(auth) },
    include: { company: true },
  });
  if (!analysis) throw AppError.notFound("Analyse introuvable");
  return analysis;
}

export async function listAnalyses(companyId: string, auth: AuthenticatedUser) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.analysis.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { balanceLines: true } } },
  });
}

export async function createAnalysis(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateAnalysisInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.analysis.create({ data: { ...input, companyId } });
}

export async function getAnalysis(analysisId: string, auth: AuthenticatedUser) {
  return getOwnedAnalysisOrThrow(analysisId, auth);
}

export async function updateAnalysis(
  analysisId: string,
  auth: AuthenticatedUser,
  input: UpdateAnalysisInput,
) {
  await getOwnedAnalysisOrThrow(analysisId, auth);
  return prisma.analysis.update({ where: { id: analysisId }, data: input });
}

export async function deleteAnalysis(
  analysisId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedAnalysisOrThrow(analysisId, auth);
  await prisma.analysis.delete({ where: { id: analysisId } });
}

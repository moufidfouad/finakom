import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedAnalysisOrThrow } from "@/modules/analyses/analyses.service";
import { buildFullReport, FullReport } from "./buildReport";

export async function getFullReport(
  analysisId: string,
  auth: AuthenticatedUser,
): Promise<FullReport> {
  await getOwnedAnalysisOrThrow(analysisId, auth);

  const cached = await prisma.analysisResult.findUnique({
    where: { analysisId },
  });
  if (cached) {
    return cached.results as unknown as FullReport;
  }

  const lines = await prisma.balanceLine.findMany({ where: { analysisId } });
  if (lines.length === 0) {
    throw AppError.badRequest(
      "Aucune ligne de balance saisie pour cette analyse. Renseignez d'abord la balance.",
    );
  }

  const rawLines = lines.map((l: (typeof lines)[number]) => ({
    accountNumber: l.accountNumber,
    label: l.label,
    debitN: Number(l.debitN),
    creditN: Number(l.creditN),
    debitN1: Number(l.debitN1),
    creditN1: Number(l.creditN1),
  }));

  const report = buildFullReport(rawLines);

  await prisma.analysisResult
    .upsert({
      where: { analysisId },
      create: { analysisId, results: report as object },
      update: { results: report as object },
    })
    .catch((err: unknown) =>
      console.warn("Cache résultats non sauvegardé :", err),
    );

  return report;
}

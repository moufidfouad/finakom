import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { AppError } from "@/utils/AppError";
import { getOwnedAnalysisOrThrow } from "@/modules/analyses/analyses.service";
import { getTrialBalance } from "@/modules/accounting/journalEntries/journalEntries.service";
import { ReplaceBalanceInput } from "./balance.schemas";

export async function getBalance(analysisId: string, auth: AuthenticatedUser) {
  await getOwnedAnalysisOrThrow(analysisId, auth);
  return prisma.balanceLine.findMany({
    where: { analysisId },
    orderBy: { lineOrder: "asc" },
  });
}

export async function replaceBalance(
  analysisId: string,
  auth: AuthenticatedUser,
  input: ReplaceBalanceInput,
) {
  await getOwnedAnalysisOrThrow(analysisId, auth);

  await prisma.$transaction([
    prisma.balanceLine.deleteMany({ where: { analysisId } }),
    prisma.balanceLine.createMany({
      data: input.lines.map((line, index) => ({
        analysisId,
        accountNumber: line.accountNumber,
        label: line.label,
        debitN: line.debitN,
        creditN: line.creditN,
        debitN1: line.debitN1,
        creditN1: line.creditN1,
        lineOrder: index,
      })),
    }),
    prisma.analysisResult.deleteMany({ where: { analysisId } }),
  ]);

  return getBalance(analysisId, auth);
}

/**
 * Génère la balance de l'analyse directement depuis les écritures comptables
 * déjà postées (module Comptabilité générale) plutôt que depuis un import
 * manuel — les deux flux restent disponibles en parallèle : rien n'empêche une
 * entreprise qui n'utilise pas encore la comptabilité générale de continuer à
 * importer sa balance depuis un fichier externe (comptable, autre logiciel...).
 *
 * Les périodes N / N-1 sont dérivées des dates d'exercice de l'analyse
 * (année civile se terminant à `exerciceNDate` / `exerciceN1Date`) — cohérent
 * avec la façon dont l'analyse elle-même définit ses deux exercices comparés.
 */
export async function generateBalanceFromLedger(
  analysisId: string,
  auth: AuthenticatedUser,
) {
  const analysis = await getOwnedAnalysisOrThrow(analysisId, auth);

  const periodNStart = new Date(analysis.exerciceNDate.getFullYear(), 0, 1);
  const periodN1Start = analysis.exerciceN1Date
    ? new Date(analysis.exerciceN1Date.getFullYear(), 0, 1)
    : undefined;

  const trialBalance = await getTrialBalance(analysis.companyId, auth, {
    periodNStart,
    periodNEnd: analysis.exerciceNDate,
    ...(analysis.exerciceN1Date && periodN1Start
      ? { periodN1Start, periodN1End: analysis.exerciceN1Date }
      : {}),
  });

  if (trialBalance.length === 0) {
    throw AppError.badRequest(
      "Aucune écriture comptable trouvée pour la période de cet exercice — saisissez des écritures (module Comptabilité générale) ou importez une balance manuellement.",
    );
  }

  return replaceBalance(analysisId, auth, {
    lines: trialBalance.map((b) => ({
      accountNumber: b.accountNumber,
      label: b.label,
      debitN: b.debitN,
      creditN: b.creditN,
      debitN1: b.debitN1,
      creditN1: b.creditN1,
    })),
  });
}

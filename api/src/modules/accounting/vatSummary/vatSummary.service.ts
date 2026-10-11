import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { resolveAccountForRole } from "@/modules/accounting/chartOfAccounts/chartOfAccounts.service";
import { computeVatSummary } from "./vatSummaryEngine";
import { VatSummaryQuery } from "./vatSummary.schemas";

/**
 * Synthèse TVA sur une période : agrège les lignes déjà postées sur les
 * comptes portant les rôles TVA_COLLECTEE et TVA_DEDUCTIBLE (résolus, jamais
 * un numéro de compte codé en dur — chaque entreprise garde son propre plan
 * comptable). La donnée existe déjà entièrement grâce à la contre-passation
 * automatique des ventes et achats ; ce service ne fait qu'agréger et mettre
 * en forme ce qui est déjà comptabilisé.
 */
export async function getVatSummary(
  companyId: string,
  auth: AuthenticatedUser,
  query: VatSummaryQuery,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const [collectedAccount, deductibleAccount] = await Promise.all([
    resolveAccountForRole(companyId, "TVA_COLLECTEE"),
    resolveAccountForRole(companyId, "TVA_DEDUCTIBLE"),
  ]);

  const dateFilter = { gte: query.periodStart, lte: query.periodEnd };

  const [collectedLines, deductibleLines] = await Promise.all([
    prisma.journalEntryLine.findMany({
      where: {
        chartOfAccountId: collectedAccount.id,
        journalEntry: { date: dateFilter },
      },
    }),
    prisma.journalEntryLine.findMany({
      where: {
        chartOfAccountId: deductibleAccount.id,
        journalEntry: { date: dateFilter },
      },
    }),
  ]);

  const summary = computeVatSummary(
    collectedLines.map((l: (typeof collectedLines)[number]) => ({
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
    deductibleLines.map((l: (typeof deductibleLines)[number]) => ({
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
  );

  return {
    ...summary,
    periodStart: query.periodStart,
    periodEnd: query.periodEnd,
    collectedAccount: {
      accountNumber: collectedAccount.accountNumber,
      label: collectedAccount.label,
    },
    deductibleAccount: {
      accountNumber: deductibleAccount.accountNumber,
      label: deductibleAccount.label,
    },
  };
}

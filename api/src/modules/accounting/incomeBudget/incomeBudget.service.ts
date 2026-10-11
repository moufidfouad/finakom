import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getMemberCompanyOrThrow,
  getOwnedCompanyOrThrow,
} from "@/modules/companies/companies.service";
import {
  computeMonthlyIncomeComparison,
  IncomeLine,
  signedIncomeAmount,
} from "./incomeBudgetEngine";
import { UpsertIncomeBudgetLineInput } from "./incomeBudget.schemas";

export async function listIncomeBudgetLines(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.incomeBudgetLine.findMany({
    where: { companyId, fiscalYear },
    orderBy: [{ type: "asc" }, { month: "asc" }],
  });
}

/** Le budget prévisionnel engage l'entreprise (paramètre de pilotage) : sa
 * modification reste réservée aux administrateurs — même règle que pour le
 * budget de trésorerie (voir treasury/budget/budget.service.ts). */
export async function upsertIncomeBudgetLine(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertIncomeBudgetLineInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.incomeBudgetLine.upsert({
    where: {
      companyId_fiscalYear_type_month: {
        companyId,
        fiscalYear: input.fiscalYear,
        type: input.type,
        month: input.month,
      },
    },
    create: { ...input, companyId },
    update: { amount: input.amount },
  });
}

export async function deleteIncomeBudgetLine(
  id: string,
  auth: AuthenticatedUser,
) {
  const line = await prisma.incomeBudgetLine.findUnique({ where: { id } });
  if (!line) throw AppError.notFound("Ligne de budget introuvable");
  await getOwnedCompanyOrThrow(line.companyId, auth);
  await prisma.incomeBudgetLine.delete({ where: { id } });
}

/**
 * Compare le budget saisi au réel — le réel n'est JAMAIS dupliqué dans une
 * table séparée, il est calculé directement depuis les écritures déjà
 * comptabilisées sur les comptes de classe 6 (Charge) et classe 7 (Produit),
 * agrégées par mois. Exactement le même principe déjà appliqué à la
 * trésorerie (dashboard.service.ts::getTreasuryDashboard), répliqué ici.
 */
export async function getIncomeBudgetComparison(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const yearStart = new Date(fiscalYear, 0, 1);
  const yearEnd = new Date(fiscalYear, 11, 31, 23, 59, 59);

  const [budgetLines, ledgerLines] = await Promise.all([
    prisma.incomeBudgetLine.findMany({ where: { companyId, fiscalYear } }),
    prisma.journalEntryLine.findMany({
      where: {
        chartOfAccount: { companyId, classe: { in: ["6", "7"] } },
        journalEntry: { date: { gte: yearStart, lte: yearEnd } },
      },
      include: {
        chartOfAccount: { select: { classe: true } },
        journalEntry: { select: { date: true } },
      },
    }),
  ]);

  const budget: IncomeLine[] = budgetLines.map(
    (l: (typeof budgetLines)[number]) => ({
      month: l.month,
      type: l.type as "Produit" | "Charge",
      amount: Number(l.amount),
    }),
  );

  // Un compte de charge (classe 6) a un solde normalement débiteur — le débit
  // ALIMENTE la charge, un crédit (ex: avoir fournisseur) la RÉDUIT. Inverse
  // pour un compte de produit (classe 7), normalement créditeur (voir
  // signedIncomeAmount, testé indépendamment).
  const actual: IncomeLine[] = ledgerLines
    .map((l: (typeof ledgerLines)[number]) => {
      const signed = signedIncomeAmount({
        classe: l.chartOfAccount.classe,
        debit: Number(l.debit),
        credit: Number(l.credit),
      });
      if (!signed) return null;
      return {
        month: l.journalEntry.date.getMonth() + 1,
        type: signed.type,
        amount: signed.amount,
      };
    })
    .filter((l: IncomeLine | null): l is IncomeLine => l !== null);

  const monthlyComparison = computeMonthlyIncomeComparison(budget, actual);

  return {
    fiscalYear,
    monthlyComparison,
    totalBudgetRevenue: monthlyComparison.reduce(
      (s, m) => s + m.budgetRevenue,
      0,
    ),
    totalBudgetExpense: monthlyComparison.reduce(
      (s, m) => s + m.budgetExpense,
      0,
    ),
    totalActualRevenue: monthlyComparison.reduce(
      (s, m) => s + m.actualRevenue,
      0,
    ),
    totalActualExpense: monthlyComparison.reduce(
      (s, m) => s + m.actualExpense,
      0,
    ),
  };
}

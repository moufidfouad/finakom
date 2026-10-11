import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedBusinessPlanOrThrow } from "@/modules/businessPlan/plan/plan.service";
import {
  computeBalanceYear,
  computeFinancialHealthAppreciation,
  computeInvestmentFundingSummary,
  computePLYear,
  computeProfitabilityMessage,
  buildCashflowSchedule,
  PLLineInput,
  PLYearResult,
  BalanceLineInput,
  BalanceYearResult,
} from "@/modules/businessPlan/engine/businessPlanEngine";

/**
 * Assemble le rapport complet du business plan : investissement/financement,
 * compte de résultat sur l'horizon du plan, plan de trésorerie mensuel (année 1),
 * et bilan prévisionnel avec indicateurs — en faisant systématiquement tourner
 * le moteur (jamais de valeur stockée en base), même principe que le module
 * d'analyse financière SYSCOHADA.
 */
export async function getBusinessPlanSummary(
  planId: string,
  auth: AuthenticatedUser,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);

  const [investments, fundings, plLines, cashflowLines, balanceLines] =
    await Promise.all([
      prisma.businessPlanInvestment.findMany({
        where: { businessPlanId: planId },
      }),
      prisma.businessPlanFunding.findMany({
        where: { businessPlanId: planId },
      }),
      prisma.businessPlanPLLine.findMany({ where: { businessPlanId: planId } }),
      prisma.businessPlanCashflowLine.findMany({
        where: { businessPlanId: planId },
      }),
      prisma.businessPlanBalanceLine.findMany({
        where: { businessPlanId: planId },
      }),
    ]);

  // --- Investissement & financement ---
  const investmentFunding = computeInvestmentFundingSummary(
    investments.map((i: (typeof investments)[number]) => Number(i.amount)),
    fundings.map((f: (typeof fundings)[number]) => Number(f.amount)),
  );

  // --- Compte de résultat sur l'horizon du plan ---
  const plByYear = new Map<number, PLYearResult>();
  for (let year = 1; year <= plan.horizonYears; year++) {
    const yearLines: PLLineInput[] = plLines
      .filter((l: (typeof plLines)[number]) => l.year === year)
      .map((l: (typeof plLines)[number]) => ({
        section: l.section as PLLineInput["section"],
        amount: Number(l.amount),
      }));
    plByYear.set(year, computePLYear(yearLines));
  }
  const lastYear = plan.horizonYears;
  const profitabilityMessage = computeProfitabilityMessage(
    plByYear.get(lastYear),
    `l'année ${lastYear}`,
  );

  // --- Plan de trésorerie mensuel (année 1) ---
  const cashflowScheduleLines = cashflowLines.map(
    (l: (typeof cashflowLines)[number]) => ({
      month: l.month,
      type: l.type as "Encaissement" | "Décaissement",
      amount: Number(l.amount),
    }),
  );
  // Le plan de trésorerie du business plan démarre à 0 (pas de solde d'ouverture
  // séparé dans ce classeur : "Apport personnel" et "Emprunts" sont eux-mêmes des
  // lignes d'encaissement du mois 1, contrairement au module Trésorerie de gestion
  // courante qui a un solde d'ouverture dédié). Les seuils d'alerte ne s'appliquent
  // pas à un plan prévisionnel : on les fixe à -Infinity pour neutraliser le champ
  // "signal" (toujours "OK"), non exploité côté prévisionnel.
  const cashflowSchedule = buildCashflowSchedule(
    cashflowScheduleLines,
    0,
    -Infinity,
    -Infinity,
  );
  const cashAtYearEnd = cashflowSchedule[11]?.closingBalance ?? 0;

  // --- Bilan prévisionnel (résultat net et trésorerie liés aux deux moteurs ci-dessus) ---
  const balanceByYear = new Map<number, BalanceYearResult>();
  for (let year = 1; year <= plan.horizonYears; year++) {
    const yearLines: BalanceLineInput[] = balanceLines
      .filter((l: (typeof balanceLines)[number]) => l.year === year)
      .map((l: (typeof balanceLines)[number]) => ({
        side: l.side as "Actif" | "Passif",
        category: l.category,
        amount: Number(l.amount),
      }));
    const resultatNet = plByYear.get(year)?.resultatNet ?? 0;
    // Seule l'année 1 a un plan de trésorerie mensuel détaillé dans ce modèle ;
    // les années suivantes reprennent la trésorerie de clôture comme point de
    // départ faute de plan mensuel dédié (fidèle à la structure du classeur, qui
    // ne détaille le mensuel que sur l'année 1).
    const tresorerieFinPeriode = year === 1 ? cashAtYearEnd : cashAtYearEnd;
    balanceByYear.set(
      year,
      computeBalanceYear(yearLines, resultatNet, tresorerieFinPeriode),
    );
  }
  const healthAppreciation = computeFinancialHealthAppreciation(
    Array.from(balanceByYear.values()),
  );

  return {
    plan: {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      horizonYears: plan.horizonYears,
    },
    investmentFunding,
    profitLoss: {
      byYear: Object.fromEntries(plByYear),
      profitabilityMessage,
    },
    cashflow: {
      schedule: cashflowSchedule,
      totalYearEnd: cashAtYearEnd,
    },
    balance: {
      byYear: Object.fromEntries(balanceByYear),
      healthAppreciation,
    },
  };
}

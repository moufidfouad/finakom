import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateTreasurySettings } from "@/modules/treasury/settings/settings.service";
import {
  buildMonthlySchedule,
  computeCashPosition,
  computeSignal,
} from "@/modules/treasury/engine/treasuryEngine";
import { INFLOW_CATEGORIES } from "@/modules/treasury/entries/entries.schemas";

export async function getTreasuryDashboard(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const [entries, budgetLines, settings] = await Promise.all([
    prisma.treasuryEntry.findMany({ where: { companyId } }),
    prisma.treasuryBudgetLine.findMany({ where: { companyId, fiscalYear } }),
    getOrCreateTreasurySettings(companyId),
  ]);

  const openingCash = Number(settings.openingCashBalance);
  const openingBank = Number(settings.openingBankBalance);

  const movementsForEngine: {
    date: Date;
    type: "Encaissement" | "Décaissement";
    amount: number;
    support: string;
    category: string;
  }[] = entries.map((e: (typeof entries)[number]) => ({
    date: e.date,
    type: e.type as "Encaissement" | "Décaissement",
    amount: Number(e.amount),
    support: e.support,
    category: e.category,
  }));

  const position = computeCashPosition(
    movementsForEngine,
    openingCash,
    openingBank,
  );
  const signal = computeSignal(
    position.totalBalance,
    Number(settings.alertThreshold),
    Number(settings.criticalThreshold),
  );

  // Réel agrégé par mois/catégorie DEPUIS le journal (jamais dupliqué dans une table séparée).
  const yearEntries = entries.filter(
    (e: (typeof entries)[number]) => e.date.getFullYear() === fiscalYear,
  );
  const actualLines: {
    month: number;
    type: "Encaissement" | "Décaissement";
    amount: number;
  }[] = yearEntries.map((e: (typeof entries)[number]) => ({
    month: e.date.getMonth() + 1,
    type: e.type as "Encaissement" | "Décaissement",
    amount: Number(e.amount),
  }));
  const forecastLines: {
    month: number;
    type: "Encaissement" | "Décaissement";
    amount: number;
  }[] = budgetLines.map((l: (typeof budgetLines)[number]) => ({
    month: l.month,
    type: l.type as "Encaissement" | "Décaissement",
    amount: Number(l.amount),
  }));

  const forecastSchedule = buildMonthlySchedule(
    forecastLines,
    openingCash + openingBank,
    Number(settings.alertThreshold),
    Number(settings.criticalThreshold),
  );
  const actualSchedule = buildMonthlySchedule(
    actualLines,
    openingCash + openingBank,
    Number(settings.alertThreshold),
    Number(settings.criticalThreshold),
  );

  const forecastInflowTotal = forecastLines
    .filter((l) => l.type === "Encaissement")
    .reduce((s, l) => s + l.amount, 0);
  const forecastOutflowTotal = forecastLines
    .filter((l) => l.type === "Décaissement")
    .reduce((s, l) => s + l.amount, 0);
  const actualInflowTotal = actualLines
    .filter((l) => l.type === "Encaissement")
    .reduce((s, l) => s + l.amount, 0);
  const actualOutflowTotal = actualLines
    .filter((l) => l.type === "Décaissement")
    .reduce((s, l) => s + l.amount, 0);

  const criticalMonths = forecastSchedule.filter(
    (m) => m.signal === "CRITIQUE",
  ).length;
  const alertMonths = forecastSchedule.filter(
    (m) => m.signal === "ALERTE",
  ).length;
  const okMonths = forecastSchedule.filter((m) => m.signal === "OK").length;

  const mobileMoneySupports = new Set(["Orange Money", "MTN MoMo", "Wave"]);
  const inflowByMobile = movementsForEngine
    .filter(
      (m) => m.type === "Encaissement" && mobileMoneySupports.has(m.support),
    )
    .reduce((s, m) => s + m.amount, 0);
  const inflowByBank = movementsForEngine
    .filter((m) => m.type === "Encaissement" && m.support === "Banque")
    .reduce((s, m) => s + m.amount, 0);

  const lastEntryDate =
    entries.length > 0
      ? entries.reduce(
          (max: Date, e: (typeof entries)[number]) =>
            e.date > max ? e.date : max,
          entries[0].date,
        )
      : null;

  return {
    position: {
      totalBalance: position.totalBalance,
      bankBalance: position.bankBalance,
      cashBalance: position.cashBalance,
      inflowYTD: position.totalInflow,
      outflowYTD: position.totalOutflow,
      netFlowYTD: position.netFlow,
      alertThreshold: Number(settings.alertThreshold),
      signal,
    },
    forecast: {
      inflowAnnual: forecastInflowTotal,
      outflowAnnual: forecastOutflowTotal,
      netFlowAnnual: forecastInflowTotal - forecastOutflowTotal,
      finalBalance:
        forecastSchedule[11]?.closingBalance ?? openingCash + openingBank,
      minBalance: Math.min(...forecastSchedule.map((m) => m.closingBalance)),
      criticalMonths,
      alertMonths,
      okMonths,
      schedule: forecastSchedule,
    },
    actualVsForecast: {
      inflowActual: actualInflowTotal,
      outflowActual: actualOutflowTotal,
      inflowVariance: actualInflowTotal - forecastInflowTotal,
      outflowVariance: forecastOutflowTotal - actualOutflowTotal,
      netFlowVariance:
        actualInflowTotal -
        actualOutflowTotal -
        (forecastInflowTotal - forecastOutflowTotal),
      inflowRealizationRate:
        forecastInflowTotal > 0 ? actualInflowTotal / forecastInflowTotal : 0,
      outflowRealizationRate:
        forecastOutflowTotal > 0
          ? actualOutflowTotal / forecastOutflowTotal
          : 0,
      schedule: actualSchedule,
    },
    indicators: {
      avgCollectionDays: settings.avgCollectionDays,
      avgPaymentDays: settings.avgPaymentDays,
      pctInflowBank:
        position.totalInflow > 0 ? inflowByBank / position.totalInflow : 0,
      pctInflowMobileMoney:
        position.totalInflow > 0 ? inflowByMobile / position.totalInflow : 0,
      operationsCount: entries.length,
      lastEntryDate,
      knownInflowCategories: INFLOW_CATEGORIES,
    },
  };
}

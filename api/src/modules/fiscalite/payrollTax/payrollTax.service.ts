import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateTaxSettings } from "@/modules/fiscalite/settings/settings.service";
import { computePayrollTax } from "./payrollTaxEngine";
import { UpsertMonthlyPayrollTaxInput } from "./payrollTax.schemas";

export async function upsertMonthlyPayrollTax(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertMonthlyPayrollTaxInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const period = new Date(
    Date.UTC(input.period.getUTCFullYear(), input.period.getUTCMonth(), 1),
  );

  return prisma.monthlyPayrollTax.upsert({
    where: { companyId_period: { companyId, period } },
    create: {
      companyId,
      period,
      grossPayroll: input.grossPayroll,
      paid: input.paid ?? false,
    },
    update: {
      grossPayroll: input.grossPayroll,
      ...(input.paid !== undefined && { paid: input.paid }),
    },
  });
}

/** Même patron que getVatYearSummary — 12 mois toujours renvoyés (existants
 * ou vides), chaque mois recalculé à partir des taux courants de
 * TaxSettings, jamais de valeurs dérivées stockées en base. */
export async function getPayrollTaxYearSummary(
  companyId: string,
  auth: AuthenticatedUser,
  year: number,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const settings = await getOrCreateTaxSettings(companyId);

  const brackets = {
    allowanceRate: Number(settings.incomeTaxAllowanceRate),
    bracket1Threshold: Number(settings.incomeTaxBracket1Threshold),
    bracket1Rate: Number(settings.incomeTaxBracket1Rate),
    bracket2Threshold: Number(settings.incomeTaxBracket2Threshold),
    bracket2Rate: Number(settings.incomeTaxBracket2Rate),
    bracket3Threshold: Number(settings.incomeTaxBracket3Threshold),
    bracket3Rate: Number(settings.incomeTaxBracket3Rate),
    bracket4Rate: Number(settings.incomeTaxBracket4Rate),
  };

  const returns = await prisma.monthlyPayrollTax.findMany({
    where: {
      companyId,
      period: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    orderBy: { period: "asc" },
  });
  const byMonth = new Map<number, (typeof returns)[number]>(
    returns.map((r: (typeof returns)[number]) => [r.period.getUTCMonth(), r]),
  );

  return Array.from({ length: 12 }, (_, i) => {
    const existing = byMonth.get(i);
    const computed = computePayrollTax(
      { grossPayroll: existing ? Number(existing.grossPayroll) : 0 },
      Number(settings.socialContribEmployerRate),
      Number(settings.socialContribEmployeeRate),
      Number(settings.vocationalTrainingRate),
      brackets,
    );
    return {
      month: i,
      id: existing?.id ?? null,
      paid: existing?.paid ?? false,
      ...computed,
    };
  });
}

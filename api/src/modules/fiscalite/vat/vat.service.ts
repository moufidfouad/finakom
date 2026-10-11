import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateTaxSettings } from "@/modules/fiscalite/settings/settings.service";
import { computeVatYear } from "./vatEngine";
import { UpsertMonthlyVatReturnInput } from "./vat.schemas";

export async function upsertMonthlyVatReturn(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertMonthlyVatReturnInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const period = new Date(
    Date.UTC(input.period.getUTCFullYear(), input.period.getUTCMonth(), 1),
  );

  return prisma.monthlyVatReturn.upsert({
    where: { companyId_period: { companyId, period } },
    create: {
      companyId,
      period,
      salesIncTax: input.salesIncTax,
      purchasesIncTax: input.purchasesIncTax,
      status: input.status,
    },
    update: {
      salesIncTax: input.salesIncTax,
      purchasesIncTax: input.purchasesIncTax,
      ...(input.status && { status: input.status }),
    },
  });
}

/** Renvoie les 12 mois de l'année (existants ou vides) avec tous les champs
 * dérivés calculés en séquence — jamais stockés en base, toujours recalculés
 * à partir des taux courants de TaxSettings, pour qu'une mise à jour de taux
 * se répercute immédiatement sans script de migration des données saisies.
 */
export async function getVatYearSummary(
  companyId: string,
  auth: AuthenticatedUser,
  year: number,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const settings = await getOrCreateTaxSettings(companyId);

  const returns = await prisma.monthlyVatReturn.findMany({
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

  const months = Array.from({ length: 12 }, (_, i) => {
    const existing = byMonth.get(i);
    return {
      month: i,
      id: existing?.id ?? null,
      status: existing?.status ?? "À déclarer",
      salesIncTax: existing ? Number(existing.salesIncTax) : 0,
      purchasesIncTax: existing ? Number(existing.purchasesIncTax) : 0,
    };
  });

  const computed = computeVatYear(months, Number(settings.vatStandardRate));

  return months.map((m, i) => ({
    month: m.month,
    id: m.id,
    status: m.status,
    ...computed[i],
  }));
}

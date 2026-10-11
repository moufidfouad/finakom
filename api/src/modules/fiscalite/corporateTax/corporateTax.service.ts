import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateTaxSettings } from "@/modules/fiscalite/settings/settings.service";
import { computeCorporateTax } from "./corporateTaxEngine";
import { UpsertCorporateTaxReturnInput } from "./corporateTax.schemas";

export async function upsertCorporateTaxReturn(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertCorporateTaxReturnInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const { fiscalYear, ...fields } = input;

  return prisma.corporateTaxReturn.upsert({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
    create: { companyId, fiscalYear, ...fields },
    update: fields,
  });
}

export async function getCorporateTaxSummary(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const settings = await getOrCreateTaxSettings(companyId);

  const existing = await prisma.corporateTaxReturn.findUnique({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
  });
  const base = existing ?? {
    id: null,
    accountingResult: 0,
    fiscalReintegrations: 0,
    fiscalDeductions: 0,
    priorYearLoss: 0,
    annualRevenue: 0,
    priorYearTax: 0,
    taxCredits: 0,
    installmentsPaidQ1: 0,
    installmentsPaidQ2: 0,
    installmentsPaidQ3: 0,
    installmentsPaidQ4: 0,
  };

  const computed = computeCorporateTax(
    {
      accountingResult: Number(base.accountingResult),
      fiscalReintegrations: Number(base.fiscalReintegrations),
      fiscalDeductions: Number(base.fiscalDeductions),
      priorYearLoss: Number(base.priorYearLoss),
      annualRevenue: Number(base.annualRevenue),
      priorYearTax: Number(base.priorYearTax),
      taxCredits: Number(base.taxCredits),
      installmentsPaidQ1: Number(base.installmentsPaidQ1),
      installmentsPaidQ2: Number(base.installmentsPaidQ2),
      installmentsPaidQ3: Number(base.installmentsPaidQ3),
      installmentsPaidQ4: Number(base.installmentsPaidQ4),
    },
    Number(settings.corporateTaxRate),
    Number(settings.corporateTaxMinRate),
    Number(settings.corporateTaxInstallmentRate),
  );

  return { id: base.id, fiscalYear, ...computed };
}

export async function getCorporateTaxReturn(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const record = await prisma.corporateTaxReturn.findUnique({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
  });
  if (!record)
    throw AppError.notFound("Aucune déclaration IS pour cet exercice");
  return record;
}

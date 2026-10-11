import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateTaxSettings } from "@/modules/fiscalite/settings/settings.service";
import {
  BUSINESS_LICENSE_BRACKETS,
  computeBusinessLicense,
} from "./businessLicenseEngine";
import { UpsertBusinessLicenseReturnInput } from "./businessLicense.schemas";

export async function upsertBusinessLicenseReturn(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertBusinessLicenseReturnInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const { fiscalYear, ...fields } = input;

  return prisma.businessLicenseReturn.upsert({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
    create: { companyId, fiscalYear, ...fields },
    update: fields,
  });
}

export async function getBusinessLicenseSummary(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
  monthsLate: number,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const settings = await getOrCreateTaxSettings(companyId);

  const existing = await prisma.businessLicenseReturn.findUnique({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
  });
  const base = existing ?? {
    id: null,
    annualRevenue: 0,
    fixedDuty: 0,
    paid: false,
  };

  const computed = computeBusinessLicense(
    {
      annualRevenue: Number(base.annualRevenue),
      fixedDuty: Number(base.fixedDuty),
    },
    Number(settings.businessLicenseRate),
    monthsLate,
  );

  return {
    id: base.id,
    fiscalYear,
    paid: base.paid,
    ...computed,
    brackets: BUSINESS_LICENSE_BRACKETS,
  };
}

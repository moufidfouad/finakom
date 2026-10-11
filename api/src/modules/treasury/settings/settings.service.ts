import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { UpsertTreasurySettingsInput } from "./settings.schemas";

export async function getOrCreateTreasurySettings(companyId: string) {
  const existing = await prisma.treasurySettings.findUnique({
    where: { companyId },
  });
  if (existing) return existing;
  return prisma.treasurySettings.create({ data: { companyId } });
}

export async function getTreasurySettings(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return getOrCreateTreasurySettings(companyId);
}

export async function updateTreasurySettings(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertTreasurySettingsInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await getOrCreateTreasurySettings(companyId);
  return prisma.treasurySettings.update({ where: { companyId }, data: input });
}

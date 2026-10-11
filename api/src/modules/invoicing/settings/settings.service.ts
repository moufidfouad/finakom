import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { UpsertSettingsInput } from "./settings.schemas";

export async function getOrCreateSettings(companyId: string) {
  const existing = await prisma.invoicingSettings.findUnique({
    where: { companyId },
  });
  if (existing) return existing;
  return prisma.invoicingSettings.create({ data: { companyId } });
}

export async function getSettings(companyId: string, auth: AuthenticatedUser) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return getOrCreateSettings(companyId);
}

export async function updateSettings(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertSettingsInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await getOrCreateSettings(companyId);
  return prisma.invoicingSettings.update({ where: { companyId }, data: input });
}

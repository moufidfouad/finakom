import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { UpsertFixedAssetSettingsInput } from "./settings.schemas";

export async function getOrCreateFixedAssetSettings(companyId: string) {
  const existing = await prisma.fixedAssetSettings.findUnique({
    where: { companyId },
  });
  if (existing) return existing;
  const now = new Date();
  return prisma.fixedAssetSettings.create({
    data: {
      companyId,
      fiscalYear: now.getFullYear(),
      closingDate: new Date(now.getFullYear(), 11, 31),
    },
  });
}

export async function getFixedAssetSettings(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return getOrCreateFixedAssetSettings(companyId);
}

export async function updateFixedAssetSettings(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertFixedAssetSettingsInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await getOrCreateFixedAssetSettings(companyId);
  return prisma.fixedAssetSettings.update({
    where: { companyId },
    data: input,
  });
}

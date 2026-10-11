import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { UpsertTaxSettingsInput } from "./settings.schemas";

/** Auto-création avec les valeurs par défaut du schéma (barème camerounais
 * de référence) si l'entreprise n'a encore rien personnalisé — même patron
 * que getOrCreateFixedAssetSettings, appelée par tous les autres services
 * du module fiscalité qui ont besoin des taux courants. */
export async function getOrCreateTaxSettings(companyId: string) {
  const existing = await prisma.taxSettings.findUnique({
    where: { companyId },
  });
  if (existing) return existing;
  return prisma.taxSettings.create({ data: { companyId } });
}

export async function getTaxSettings(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return getOrCreateTaxSettings(companyId);
}

export async function updateTaxSettings(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertTaxSettingsInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await getOrCreateTaxSettings(companyId);
  return prisma.taxSettings.update({ where: { companyId }, data: input });
}

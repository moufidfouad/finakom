import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import {
  isCompanyAdmin,
  getMemberCompanyOrThrow,
} from "@/modules/companies/companies.service";
import { getOwnedFixedAssetOrThrow } from "@/modules/fixedAssets/assets/assets.service";
import { computeDepreciation } from "@/modules/fixedAssets/engine/depreciationEngine";
import { getOrCreateFixedAssetSettings } from "@/modules/fixedAssets/settings/settings.service";
import { CreateAssetMovementInput } from "./movements.schemas";

export async function listMovements(
  fixedAssetId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedFixedAssetOrThrow(fixedAssetId, auth);
  return prisma.assetMovement.findMany({
    where: { fixedAssetId },
    orderBy: { date: "desc" },
  });
}

/**
 * Enregistre un mouvement (acquisition complémentaire, cession, mise en rebut).
 * Pour une cession, la plus/moins-value = prix de cession - VNC à la date du
 * mouvement (formule K du classeur), calculée via le moteur d'amortissement.
 */
export async function createMovement(
  fixedAssetId: string,
  auth: AuthenticatedUser,
  input: CreateAssetMovementInput,
) {
  const asset = await getOwnedFixedAssetOrThrow(fixedAssetId, auth);

  let disposalGainLoss: number | null = null;
  if (input.type === "Cession" && input.disposalPrice !== undefined) {
    const settings = await getOrCreateFixedAssetSettings(asset.companyId);
    const { netBookValue } = computeDepreciation({
      grossValue: Number(asset.grossValue),
      acquisitionDate: asset.acquisitionDate,
      durationYears: asset.durationYears,
      method: asset.method as "Linéaire" | "Dégressif" | "Non amortissable",
      closingDate: input.date,
      degressiveCoefficient: Number(settings.degressiveCoefficient),
    });
    disposalGainLoss = input.disposalPrice - netBookValue;
  }

  const movement = await prisma.assetMovement.create({
    data: { ...input, companyId: asset.companyId, fixedAssetId },
  });

  return { ...movement, disposalGainLoss };
}

export async function deleteMovement(id: string, auth: AuthenticatedUser) {
  const movement = await prisma.assetMovement.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!movement) throw AppError.notFound("Mouvement introuvable");

  const hasAccess =
    isSuperAdmin(auth.role) ||
    movement.company.userId === auth.userId ||
    (await isCompanyAdmin(movement.companyId, auth));
  if (!hasAccess) throw AppError.notFound("Mouvement introuvable");

  await prisma.assetMovement.delete({ where: { id } });
}

/** Journal complet des mouvements de l'entreprise (toutes immobilisations confondues) — pour le tableau de bord. */
export async function listCompanyMovements(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.assetMovement.findMany({
    where: { companyId },
    orderBy: { date: "desc" },
  });
}

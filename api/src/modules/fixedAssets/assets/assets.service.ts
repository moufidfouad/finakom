import { prisma } from '@/config/prisma';
import { AppError } from '@/utils/AppError';
import { AuthenticatedUser } from '@/types/express';
import { companyMemberWhereNested } from '@/utils/authContext';
import { getMemberCompanyOrThrow } from '@/modules/companies/companies.service';
import { assertCanModifyOwnedResource } from '@/utils/resourceOwnership';
import { generateFixedAssetCode } from '@/utils/codeGenerator';
import { computeDepreciation } from '@/modules/fixedAssets/engine/depreciationEngine';
import { getOrCreateFixedAssetSettings } from '@/modules/fixedAssets/settings/settings.service';
import { CreateFixedAssetInput, UpdateFixedAssetInput } from './assets.schemas';

type FixedAssetRow = Awaited<ReturnType<typeof getOwnedFixedAssetOrThrow>>;

async function withDepreciation(asset: FixedAssetRow, companyId: string) {
  const settings = await getOrCreateFixedAssetSettings(companyId);
  const result = computeDepreciation({
    grossValue: Number(asset.grossValue),
    acquisitionDate: asset.acquisitionDate,
    durationYears: asset.durationYears,
    method: asset.method as 'Linéaire' | 'Dégressif' | 'Non amortissable',
    closingDate: settings.closingDate,
    degressiveCoefficient: Number(settings.degressiveCoefficient),
  });
  return { ...asset, depreciation: result };
}

export async function getOwnedFixedAssetOrThrow(assetId: string, auth: AuthenticatedUser) {
  const asset = await prisma.fixedAsset.findFirst({
    where: { id: assetId, ...companyMemberWhereNested(auth) },
    include: { createdBy: { select: { id: true, email: true, fullName: true } } },
  });
  if (!asset) throw AppError.notFound('Immobilisation introuvable');
  return asset;
}

async function assertCanModifyFixedAsset(asset: { companyId: string; createdById: string | null }, auth: AuthenticatedUser) {
  await assertCanModifyOwnedResource(asset, auth, {
    errorMessage: "Seul le créateur de cette immobilisation, un administrateur de l'entreprise, ou le super-administrateur peut la modifier.",
  });
}

export async function listFixedAssets(companyId: string, auth: AuthenticatedUser) {
  await getMemberCompanyOrThrow(companyId, auth);
  const assets = await prisma.fixedAsset.findMany({
    where: { companyId },
    orderBy: { code: 'asc' },
    include: { createdBy: { select: { id: true, email: true, fullName: true } } },
  });
  return Promise.all(assets.map((a: (typeof assets)[number]) => withDepreciation(a, companyId)));
}

export async function getFixedAsset(assetId: string, auth: AuthenticatedUser) {
  const asset = await getOwnedFixedAssetOrThrow(assetId, auth);
  return withDepreciation(asset, asset.companyId);
}

export async function createFixedAsset(companyId: string, auth: AuthenticatedUser, input: CreateFixedAssetInput) {
  await getMemberCompanyOrThrow(companyId, auth);
  const code = await generateFixedAssetCode(companyId);
  const asset = await prisma.fixedAsset.create({
    data: { ...input, companyId, code, createdById: auth.userId },
    include: { createdBy: { select: { id: true, email: true, fullName: true } } },
  });
  return withDepreciation(asset, companyId);
}

export async function updateFixedAsset(assetId: string, auth: AuthenticatedUser, input: UpdateFixedAssetInput) {
  const asset = await getOwnedFixedAssetOrThrow(assetId, auth);
  await assertCanModifyFixedAsset(asset, auth);
  const updated = await prisma.fixedAsset.update({
    where: { id: assetId },
    data: input,
    include: { createdBy: { select: { id: true, email: true, fullName: true } } },
  });
  return withDepreciation(updated, asset.companyId);
}

export async function deleteFixedAsset(assetId: string, auth: AuthenticatedUser) {
  const asset = await getOwnedFixedAssetOrThrow(assetId, auth);
  await assertCanModifyFixedAsset(asset, auth);
  await prisma.fixedAsset.delete({ where: { id: assetId } });
}

export { assertCanModifyFixedAsset };

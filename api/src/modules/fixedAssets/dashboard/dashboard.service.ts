import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateFixedAssetSettings } from "@/modules/fixedAssets/settings/settings.service";
import { computeDepreciation } from "@/modules/fixedAssets/engine/depreciationEngine";
import { ASSET_CATEGORIES } from "@/modules/fixedAssets/assets/assets.schemas";

export async function getFixedAssetDashboard(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const [assets, movements, settings] = await Promise.all([
    prisma.fixedAsset.findMany({ where: { companyId } }),
    prisma.assetMovement.findMany({ where: { companyId } }),
    getOrCreateFixedAssetSettings(companyId),
  ]);

  const computed: {
    asset: (typeof assets)[number];
    dep: ReturnType<typeof computeDepreciation>;
  }[] = assets.map((a: (typeof assets)[number]) => ({
    asset: a,
    dep: computeDepreciation({
      grossValue: Number(a.grossValue),
      acquisitionDate: a.acquisitionDate,
      durationYears: a.durationYears,
      method: a.method as "Linéaire" | "Dégressif" | "Non amortissable",
      closingDate: settings.closingDate,
      degressiveCoefficient: Number(settings.degressiveCoefficient),
    }),
  }));

  const grossValueTotal = computed.reduce(
    (s, c) => s + Number(c.asset.grossValue),
    0,
  );
  const accumulatedTotal = computed.reduce(
    (s, c) => s + c.dep.accumulatedDepreciation,
    0,
  );
  const netBookValueTotal = computed.reduce(
    (s, c) => s + c.dep.netBookValue,
    0,
  );
  const annualDotationTotal = computed.reduce(
    (s, c) => s + c.dep.annualDotation,
    0,
  );

  const byCategoryVNC: Record<string, number> = {};
  for (const cat of ASSET_CATEGORIES) byCategoryVNC[cat] = 0;
  for (const c of computed)
    byCategoryVNC[c.asset.category] =
      (byCategoryVNC[c.asset.category] ?? 0) + c.dep.netBookValue;

  const acquisitionsN = movements
    .filter((m: (typeof movements)[number]) => m.type === "Acquisition")
    .reduce(
      (s: number, m: (typeof movements)[number]) => s + Number(m.amount),
      0,
    );
  const disposalsN = movements
    .filter((m: (typeof movements)[number]) => m.type === "Cession")
    .reduce(
      (s: number, m: (typeof movements)[number]) =>
        s + Number(m.disposalPrice ?? 0),
      0,
    );
  const scrappedN = movements
    .filter((m: (typeof movements)[number]) => m.type === "Mise en rebut")
    .reduce(
      (s: number, m: (typeof movements)[number]) => s + Number(m.amount),
      0,
    );

  return {
    patrimoine: {
      assetsCount: assets.length,
      grossValueTotal,
      accumulatedDepreciationTotal: accumulatedTotal,
      netBookValueTotal,
      globalDepreciationRate:
        accumulatedTotal > 0 ? netBookValueTotal / accumulatedTotal : 0,
      annualDotationTotal,
      activeCount: computed.filter((c) => c.dep.status === "Actif").length,
      fullyDepreciatedCount: computed.filter((c) => c.dep.status === "Amorti")
        .length,
    },
    byCategoryVNC,
    movementsN: {
      acquisitions: acquisitionsN,
      disposals: disposalsN,
      scrapped: scrappedN,
      movementsCount: movements.length,
      renewalRate: grossValueTotal > 0 ? acquisitionsN / grossValueTotal : 0,
    },
    alerts: {
      over80PercentDepreciated: computed.filter(
        (c) =>
          Number(c.asset.grossValue) > 0 &&
          c.dep.accumulatedDepreciation / Number(c.asset.grossValue) > 0.8,
      ).length,
      noDepreciationRecorded: computed.filter(
        (c) =>
          c.dep.accumulatedDepreciation === 0 &&
          Number(c.asset.grossValue) > 0 &&
          c.asset.method !== "Non amortissable",
      ).length,
      underThreshold: computed.filter((c) => {
        const threshold =
          c.asset.category === "Logiciel"
            ? Number(settings.incorporealThreshold)
            : Number(settings.corporealThreshold);
        return (
          Number(c.asset.grossValue) > 0 &&
          Number(c.asset.grossValue) < threshold
        );
      }).length,
      vncUnder10Percent: computed.filter(
        (c) =>
          c.dep.status === "Actif" &&
          Number(c.asset.grossValue) > 0 &&
          c.dep.netBookValue / Number(c.asset.grossValue) < 0.1,
      ).length,
    },
    fiscalYear: settings.fiscalYear,
    closingDate: settings.closingDate,
  };
}

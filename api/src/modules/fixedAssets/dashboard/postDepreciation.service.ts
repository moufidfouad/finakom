import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateFixedAssetSettings } from "@/modules/fixedAssets/settings/settings.service";
import { computeDepreciation } from "@/modules/fixedAssets/engine/depreciationEngine";
import { buildDepreciationEntryLines } from "@/modules/accounting/engine/postingEngine";
import { postAutoEntry } from "@/modules/accounting/journalEntries/journalEntries.service";

/**
 * Comptabilise en une seule écriture la dotation aux amortissements de
 * l'exercice courant (681 Dotations / 28xx Amortissements cumulés), pour
 * l'ensemble des immobilisations amortissables de l'entreprise.
 *
 * Action EXPLICITE (pas de déclenchement automatique) : contrairement à une
 * facture ou un paiement, il n'existe pas d'événement unique qui "termine"
 * l'amortissement d'un exercice — c'est une clôture périodique délibérée,
 * cohérente avec la pratique comptable réelle (dotation généralement passée en
 * une fois à la clôture, pas en continu). Réservée aux administrateurs
 * d'entreprise, comme les autres opérations de clôture.
 *
 * Idempotente comme toute écriture automatique (`postAutoEntry`) : rappeler
 * cette action pour le même exercice ne double pas la dotation déjà comptabilisée.
 */
export async function postAnnualDepreciation(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const [assets, settings] = await Promise.all([
    prisma.fixedAsset.findMany({ where: { companyId } }),
    getOrCreateFixedAssetSettings(companyId),
  ]);

  const totalDotation = assets.reduce(
    (sum: number, a: (typeof assets)[number]) => {
      const dep = computeDepreciation({
        grossValue: Number(a.grossValue),
        acquisitionDate: a.acquisitionDate,
        durationYears: a.durationYears,
        method: a.method as "Linéaire" | "Dégressif" | "Non amortissable",
        closingDate: settings.closingDate,
        degressiveCoefficient: Number(settings.degressiveCoefficient),
      });
      return sum + dep.annualDotation;
    },
    0,
  );

  if (totalDotation <= 0) {
    throw AppError.badRequest(
      "Aucune dotation aux amortissements à comptabiliser pour cet exercice (total nul).",
    );
  }

  const sourceId = `${companyId}-${settings.fiscalYear}`;
  await postAutoEntry({
    companyId,
    journal: "OD",
    date: settings.closingDate,
    label: `Dotation aux amortissements — exercice ${settings.fiscalYear}`,
    sourceType: "FixedAssetDepreciation",
    sourceId,
    createdById: auth.userId,
    lines: buildDepreciationEntryLines({ annualDotation: totalDotation }),
  });

  return { fiscalYear: settings.fiscalYear, totalDotation };
}

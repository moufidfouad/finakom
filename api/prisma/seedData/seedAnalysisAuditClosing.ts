/**
 * Trois sous-modules regroupés car tous transversaux et légers : l'analyse
 * financière (balance équilibrée existante), le journal d'audit (quelques
 * entrées représentatives via le vrai service recordAuditLog), et la clôture
 * d'un exercice antérieur pour DÉMONTRER le verrouillage — réservée à une
 * seule entreprise pour ne pas bloquer la démonstration des autres modules
 * sur l'exercice courant.
 */
import { PrismaClient } from "@prisma/client";
import { recordAuditLog } from "../../src/modules/auditLog/auditLog.service";
import { closeFiscalYear } from "../../src/modules/accounting/fiscalYearClosing/fiscalYearClosing.service";
import {
  buildSaleEntryLines,
  buildPurchaseEntryLines,
} from "../../src/modules/accounting/engine/postingEngine";
import { buildBalanceLines } from "./referenceData";
import { AccountRoleMap, postSeedEntry } from "./postingHelpers";
import { SeededCompany } from "./seedFoundation";

export async function seedFinanceAnalysis(
  prisma: PrismaClient,
  company: SeededCompany,
) {
  const analysis = await prisma.analysis.create({
    data: {
      companyId: company.id,
      label: "Exercice 2025",
      exerciceNDate: new Date("2025-12-31"),
      exerciceN1Date: new Date("2024-12-31"),
      analystName: "Analyste FINAKOM",
      status: "completed",
    },
  });
  const lines = buildBalanceLines(company.scale);
  await prisma.balanceLine.createMany({
    data: lines.map((l, index) => ({
      analysisId: analysis.id,
      lineOrder: index,
      ...l,
    })),
  });
}

export async function seedAuditLog(
  prisma: PrismaClient,
  company: SeededCompany,
  documentNumber: string,
) {
  // Quelques entrées représentatives — pas une reconstitution exhaustive de
  // tout l'historique (déjà couvert par les contre-passations elles-mêmes),
  // juste de quoi montrer le journal dans l'interface avec des actions variées.
  await recordAuditLog({
    companyId: company.id,
    userId: company.creatorUserId,
    action: "CREATE",
    entityType: "SalesDocument",
    entityId: "seed-demo",
    entityLabel: `Facture ${documentNumber}`,
    summary: "Créée depuis le jeu de données de démonstration.",
  });
  await recordAuditLog({
    companyId: company.id,
    userId: company.creatorUserId,
    action: "UPDATE",
    entityType: "Employee",
    entityId: "seed-demo",
    entityLabel: "Fiche employé",
    summary: "Mise à jour du poste suite à un avenant au contrat.",
  });
}

/**
 * Clôture l'exercice 2025 pour une entreprise donnée — réutilise le vrai
 * service applicatif (calcul du résultat, écriture de solde, verrouillage),
 * jamais une donnée de clôture fabriquée à la main. Nécessite d'abord de
 * poster quelques écritures de charges/produits datées de 2025 (les
 * documents commerciaux du seed sont tous en 2026), sans quoi le service
 * rejetterait la clôture faute de mouvement à solder.
 */
export async function seedFiscalYearClosing(
  prisma: PrismaClient,
  company: SeededCompany,
  roleMap: AccountRoleMap,
) {
  const s = (n: number) => Math.round(n * company.scale);

  await postSeedEntry(prisma, {
    companyId: company.id,
    roleMap,
    journal: "VENTES",
    date: new Date("2025-06-15"),
    label: "Vente exercice 2025 (historique)",
    createdById: company.creatorUserId,
    lines: buildSaleEntryLines({
      totalHT: s(6000000),
      totalTVA: s(1080000),
      totalTTC: s(7080000),
    }),
  });
  await postSeedEntry(prisma, {
    companyId: company.id,
    roleMap,
    journal: "ACHATS",
    date: new Date("2025-07-10"),
    label: "Achat exercice 2025 (historique)",
    createdById: company.creatorUserId,
    lines: buildPurchaseEntryLines({
      totalHT: s(3800000),
      totalTVA: s(684000),
      totalTTC: s(4484000),
    }),
  });

  await closeFiscalYear(company.id, 2025, {
    userId: company.creatorUserId,
    email: "seed@finakom.app",
    role: "SUPERADMIN",
  });
  console.log(
    `   🔒 Exercice 2025 clôturé pour ${company.name} (démonstration du verrouillage)`,
  );
}

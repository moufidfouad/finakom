/**
 * Applique les lignes générées par postingEngine.ts (déjà testé en isolation
 * dans src/modules/accounting/engine/__tests__/) pour créer de vraies
 * écritures de journal dans le seed — jamais de logique de contre-passation
 * dupliquée ici, uniquement la résolution rôle → compte réel et la création
 * en base. Garantit que les données de démo sont comptabilisées exactement
 * comme le serait une vraie facture créée via l'application.
 */
import { PrismaClient } from "@prisma/client";
import {
  AccountRoleName,
  RoleLine,
} from "../../src/modules/accounting/engine/postingEngine";
import { checkEntryBalance } from "../../src/modules/accounting/engine/ledgerEngine";

export type AccountRoleMap = Map<AccountRoleName, string>; // role -> chartOfAccountId

/** Construit la table de résolution rôle -> compte pour une entreprise, à
 * partir des comptes déjà créés (chacun portant son rôle SYSCOHADA standard). */
export async function buildAccountRoleMap(
  prisma: PrismaClient,
  companyId: string,
): Promise<AccountRoleMap> {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId, role: { not: null } },
  });
  const map: AccountRoleMap = new Map();
  for (const a of accounts) {
    if (a.role) map.set(a.role as AccountRoleName, a.id);
  }
  return map;
}

let pieceCounter = 0;

/** Crée une écriture de journal à partir de RoleLine[] (sortie directe des
 * fonctions de postingEngine.ts) — vérifie l'équilibre avant insertion pour
 * ne jamais laisser une écriture de démo déséquilibrée en base. */
export async function postSeedEntry(
  prisma: PrismaClient,
  params: {
    companyId: string;
    roleMap: AccountRoleMap;
    journal: "ACHATS" | "VENTES" | "BANQUE" | "CAISSE" | "PAIE" | "OD";
    date: Date;
    label: string;
    sourceType?: string;
    sourceId?: string;
    createdById: string | null;
    lines: RoleLine[];
  },
) {
  const resolvedLines = params.lines.map((l) => {
    const chartOfAccountId = params.roleMap.get(l.role);
    if (!chartOfAccountId)
      throw new Error(
        `Seed: rôle de compte "${l.role}" introuvable — le plan comptable de l'entreprise doit être créé avant toute contre-passation.`,
      );
    return {
      chartOfAccountId,
      debit: l.debit,
      credit: l.credit,
      label: l.label ?? params.label,
    };
  });

  const balance = checkEntryBalance(
    resolvedLines.map((l) => ({
      accountNumber: l.chartOfAccountId,
      debit: l.debit,
      credit: l.credit,
    })),
  );
  if (!balance.isBalanced) {
    throw new Error(
      `Seed: écriture déséquilibrée pour "${params.label}" (écart ${balance.difference}) — vérifier les montants passés à postSeedEntry.`,
    );
  }

  pieceCounter += 1;
  await prisma.journalEntry.create({
    data: {
      companyId: params.companyId,
      journal: params.journal,
      date: params.date,
      pieceNumber: `${params.journal}-SEED-${String(pieceCounter).padStart(5, "0")}`,
      label: params.label,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      createdById: params.createdById,
      lines: {
        create: resolvedLines.map((l, index) => ({ ...l, lineOrder: index })),
      },
    },
  });
}

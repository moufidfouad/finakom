import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { getOrCreateTreasurySettings } from "@/modules/treasury/settings/settings.service";
import { computeCashPosition } from "@/modules/treasury/engine/treasuryEngine";
import { recordAuditLog } from "@/modules/auditLog/auditLog.service";
import {
  computeReconciliationGap,
  suggestMatches,
} from "./reconciliationEngine";
import { ParsedStatementLine } from "./bankStatement.parser";

/** Importe un lot de lignes de relevé bancaire — n'écrase jamais un import
 * précédent (contrairement à la balance comptable, un relevé bancaire
 * s'accumule mois après mois). `importBatch` regroupe les lignes d'un même
 * import pour pouvoir, si besoin, l'identifier ou le filtrer ultérieurement. */
export async function importStatementLines(
  companyId: string,
  auth: AuthenticatedUser,
  lines: ParsedStatementLine[],
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const importBatch = `import-${Date.now()}`;

  await prisma.bankStatementLine.createMany({
    data: lines.map((l) => ({
      companyId,
      date: l.date,
      label: l.label,
      amount: l.amount,
      reference: l.reference,
      importBatch,
    })),
  });

  await recordAuditLog({
    companyId,
    userId: auth.userId,
    action: "CREATE",
    entityType: "BankStatementImport",
    entityId: importBatch,
    entityLabel: `Import relevé bancaire (${lines.length} ligne(s))`,
    summary: `${lines.length} ligne(s) importée(s)`,
  });

  return listStatementLines(companyId, auth, {});
}

export async function listStatementLines(
  companyId: string,
  auth: AuthenticatedUser,
  filters: { onlyUnmatched?: boolean },
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.bankStatementLine.findMany({
    where: {
      companyId,
      ...(filters.onlyUnmatched ? { matchedEntryId: null } : {}),
    },
    include: { matchedEntry: true },
    orderBy: { date: "desc" },
  });
}

/** Rapproche manuellement une ligne de relevé avec une écriture de trésorerie —
 * la contrainte d'unicité sur `matchedEntryId` empêche d'utiliser deux fois la
 * même écriture pour deux lignes de relevé différentes. */
export async function matchStatementLine(
  statementLineId: string,
  treasuryEntryId: string,
  auth: AuthenticatedUser,
) {
  const line = await prisma.bankStatementLine.findUniqueOrThrow({
    where: { id: statementLineId },
  });
  await getMemberCompanyOrThrow(line.companyId, auth);

  const entry = await prisma.treasuryEntry.findFirst({
    where: { id: treasuryEntryId, companyId: line.companyId },
  });
  if (!entry)
    throw AppError.badRequest(
      "Écriture de trésorerie introuvable pour cette entreprise.",
    );

  const alreadyMatched = await prisma.bankStatementLine.findFirst({
    where: { matchedEntryId: treasuryEntryId },
  });
  if (alreadyMatched && alreadyMatched.id !== statementLineId) {
    throw AppError.conflict(
      "Cette écriture de trésorerie est déjà rapprochée avec une autre ligne du relevé.",
    );
  }

  const updated = await prisma.bankStatementLine.update({
    where: { id: statementLineId },
    data: { matchedEntryId: treasuryEntryId },
    include: { matchedEntry: true },
  });

  await recordAuditLog({
    companyId: line.companyId,
    userId: auth.userId,
    action: "UPDATE",
    entityType: "BankStatementLine",
    entityId: statementLineId,
    entityLabel: `Ligne relevé — ${line.label}`,
    summary: `Rapprochée avec l'écriture "${entry.label}" (${Number(entry.amount).toLocaleString("fr-FR")})`,
  });

  return updated;
}

export async function unmatchStatementLine(
  statementLineId: string,
  auth: AuthenticatedUser,
) {
  const line = await prisma.bankStatementLine.findUniqueOrThrow({
    where: { id: statementLineId },
  });
  await getMemberCompanyOrThrow(line.companyId, auth);

  const updated = await prisma.bankStatementLine.update({
    where: { id: statementLineId },
    data: { matchedEntryId: null },
  });

  await recordAuditLog({
    companyId: line.companyId,
    userId: auth.userId,
    action: "UPDATE",
    entityType: "BankStatementLine",
    entityId: statementLineId,
    entityLabel: `Ligne relevé — ${line.label}`,
    summary: "Rapprochement annulé",
  });

  return updated;
}

/** Correspondances suggérées entre lignes de relevé et écritures de trésorerie
 * non encore rapprochées — jamais appliquées automatiquement, l'utilisateur
 * valide chaque suggestion avant qu'elle ne devienne un rapprochement effectif. */
export async function getSuggestedMatches(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const [unmatchedLines, matchedEntryIds] = await Promise.all([
    prisma.bankStatementLine.findMany({
      where: { companyId, matchedEntryId: null },
    }),
    prisma.bankStatementLine.findMany({
      where: { companyId, matchedEntryId: { not: null } },
      select: { matchedEntryId: true },
    }),
  ]);
  const excludedEntryIds = matchedEntryIds
    .map((m: { matchedEntryId: string | null }) => m.matchedEntryId)
    .filter((id: string | null): id is string => !!id);

  const unmatchedEntries = await prisma.treasuryEntry.findMany({
    where: { companyId, support: "Banque", id: { notIn: excludedEntryIds } },
  });

  return suggestMatches(
    unmatchedLines.map((l: (typeof unmatchedLines)[number]) => ({
      id: l.id,
      date: l.date,
      amount: Number(l.amount),
    })),
    unmatchedEntries.map((e: (typeof unmatchedEntries)[number]) => ({
      id: e.id,
      date: e.date,
      amount: Number(e.amount),
      type: e.type as "Encaissement" | "Décaissement",
    })),
  );
}

/** Résumé du rapprochement à une date donnée : solde comptable (écritures
 * "Banque"), solde du relevé saisi, écart théorique — voir reconciliationEngine.ts
 * pour la formule. `bankStatementBalance` doit être saisi manuellement par
 * l'utilisateur (relevé du solde final affiché par la banque à cette date),
 * l'application ne peut pas le déduire des lignes importées seules (le relevé
 * pourrait être partiel, ou l'utilisateur n'avoir importé qu'une période).
 */
export async function getReconciliationSummary(
  companyId: string,
  auth: AuthenticatedUser,
  bankStatementBalance: number,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const [bankEntries, settings, unmatchedLines] = await Promise.all([
    prisma.treasuryEntry.findMany({ where: { companyId, support: "Banque" } }),
    getOrCreateTreasurySettings(companyId),
    prisma.bankStatementLine.findMany({
      where: { companyId, matchedEntryId: null },
    }),
  ]);

  const movements = bankEntries.map((e: (typeof bankEntries)[number]) => ({
    date: e.date,
    type: e.type as "Encaissement" | "Décaissement",
    amount: Number(e.amount),
    support: e.support,
    category: e.category,
  }));
  const position = computeCashPosition(
    movements,
    0,
    Number(settings.openingBankBalance),
  );
  const bookBalance = position.bankBalance;

  const matchedEntryIdsResult = await prisma.bankStatementLine.findMany({
    where: { companyId, matchedEntryId: { not: null } },
    select: { matchedEntryId: true },
  });
  const matchedIds = new Set(
    matchedEntryIdsResult.map(
      (m: { matchedEntryId: string | null }) => m.matchedEntryId,
    ),
  );
  const unreconciledBookEntries = bankEntries
    .filter((e: (typeof bankEntries)[number]) => !matchedIds.has(e.id))
    .map((e: (typeof bankEntries)[number]) => ({
      amount: Number(e.amount),
      type: e.type as "Encaissement" | "Décaissement",
    }));

  const gap = computeReconciliationGap({
    bookBalance,
    bankStatementBalance,
    unmatchedStatementLines: unmatchedLines.map(
      (l: (typeof unmatchedLines)[number]) => ({ amount: Number(l.amount) }),
    ),
    unreconciledBookEntries,
  });

  return {
    bookBalance,
    bankStatementBalance,
    ...gap,
    unmatchedStatementLinesCount: unmatchedLines.length,
    unreconciledBookEntriesCount: unreconciledBookEntries.length,
  };
}

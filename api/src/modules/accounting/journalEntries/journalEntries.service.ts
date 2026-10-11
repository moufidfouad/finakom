import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { resolveAccountForRole } from "@/modules/accounting/chartOfAccounts/chartOfAccounts.service";
import {
  checkEntryBalance,
  computeTrialBalance,
  validateLineShape,
} from "@/modules/accounting/engine/ledgerEngine";
import {
  AccountRoleName,
  RoleLine,
} from "@/modules/accounting/engine/postingEngine";
import { getNextPieceNumber } from "./journalEntrySequence.service";
import {
  CreateManualEntryInput,
  TrialBalanceQuery,
} from "./journalEntries.schemas";
import { recordAuditLog } from "@/modules/auditLog/auditLog.service";
import { assertFiscalYearOpen } from "@/modules/accounting/fiscalYearClosing/fiscalYearClosing.service";

const ENTRY_INCLUDE = {
  lines: {
    include: { chartOfAccount: true },
    orderBy: { lineOrder: "asc" as const },
  },
  createdBy: { select: { id: true, email: true, fullName: true } },
};

export async function listEntries(
  companyId: string,
  auth: AuthenticatedUser,
  filters: { journal?: string; accountId?: string } = {},
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.journalEntry.findMany({
    where: {
      companyId,
      ...(filters.journal ? { journal: filters.journal as never } : {}),
      ...(filters.accountId
        ? { lines: { some: { chartOfAccountId: filters.accountId } } }
        : {}),
    },
    include: ENTRY_INCLUDE,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Saisie manuelle d'une écriture — le contrôle d'équilibre (partie double) est
 * appliqué ICI, jamais contournable, y compris par un administrateur : aucune
 * écriture déséquilibrée ne peut être enregistrée en base.
 */
export async function createManualEntry(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateManualEntryInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await assertFiscalYearOpen(companyId, input.date);

  for (const line of input.lines) {
    const shapeError = validateLineShape({
      accountNumber: line.accountNumber,
      debit: line.debit,
      credit: line.credit,
    });
    if (shapeError) throw AppError.badRequest(shapeError);
  }
  const check = checkEntryBalance(input.lines);
  if (!check.isBalanced) {
    throw AppError.badRequest(
      `Écriture déséquilibrée : total débit ${check.totalDebit} ≠ total crédit ${check.totalCredit} (écart de ${Math.abs(check.difference)}).`,
    );
  }

  const accounts = await prisma.chartOfAccount.findMany({
    where: {
      companyId,
      accountNumber: { in: input.lines.map((l) => l.accountNumber) },
    },
  });
  const accountByNumber = new Map<string, (typeof accounts)[number]>(
    accounts.map((a: (typeof accounts)[number]) => [a.accountNumber, a]),
  );
  for (const line of input.lines) {
    if (!accountByNumber.has(line.accountNumber)) {
      throw AppError.badRequest(
        `Le compte ${line.accountNumber} n'existe pas dans le plan comptable de cette entreprise.`,
      );
    }
  }

  const pieceNumber = await getNextPieceNumber(companyId, input.journal);

  const entry = await prisma.journalEntry.create({
    data: {
      companyId,
      journal: input.journal,
      date: input.date,
      pieceNumber,
      label: input.label,
      createdById: auth.userId,
      lines: {
        create: input.lines.map((l, index) => ({
          chartOfAccountId: accountByNumber.get(l.accountNumber)!.id,
          label: l.label,
          debit: l.debit,
          credit: l.credit,
          lineOrder: index,
        })),
      },
    },
    include: ENTRY_INCLUDE,
  });

  const totalAmount = input.lines.reduce((s, l) => s + l.debit, 0);
  await recordAuditLog({
    companyId,
    userId: auth.userId,
    action: "CREATE",
    entityType: "JournalEntry",
    entityId: entry.id,
    entityLabel: `Écriture ${entry.pieceNumber}`,
    summary: `Créée manuellement : ${input.lines.length} ligne(s), ${totalAmount.toLocaleString("fr-FR")} — "${input.label}"`,
  });

  return entry;
}

/**
 * Contre-passation automatique (facture émise, paiement reçu...) — les lignes
 * arrivent déjà exprimées par RÔLE (voir postingEngine.ts), résolues ici vers
 * les comptes réels de l'entreprise. Best-effort : si un rôle requis n'est pas
 * encore configuré dans le plan comptable, l'erreur explicite remonte à
 * l'appelant, qui décide de bloquer ou non l'opération métier d'origine (voir
 * documents.service.ts / payments.service.ts — jamais silencieusement ignorée,
 * mais jamais non plus imposée comme un blocage strict systématique).
 * Idempotent : ignore silencieusement si une écriture existe déjà pour cette
 * source (évite une double comptabilisation en cas de nouvel appel accidentel).
 */
export async function postAutoEntry(params: {
  companyId: string;
  journal: "ACHATS" | "VENTES" | "BANQUE" | "CAISSE" | "PAIE" | "OD";
  date: Date;
  label: string;
  sourceType: string;
  sourceId: string;
  createdById: string | null;
  lines: RoleLine[];
}): Promise<void> {
  const existing = await prisma.journalEntry.findFirst({
    where: { sourceType: params.sourceType, sourceId: params.sourceId },
  });
  if (existing) return;

  // Absorbée par le try/catch best-effort déjà en place chez chaque appelant
  // (documents.service.ts, payments.service.ts, payroll.service.ts...) — une
  // facture ou un paiement ne doit jamais être bloqué par un exercice clos,
  // seul l'avertissement remonte, exactement comme pour un rôle de compte manquant.
  await assertFiscalYearOpen(params.companyId, params.date);

  const resolvedAccounts = await Promise.all(
    params.lines.map((l) =>
      resolveAccountForRole(params.companyId, l.role as AccountRoleName),
    ),
  );

  const check = checkEntryBalance(
    params.lines.map((l) => ({
      accountNumber: l.role,
      debit: l.debit,
      credit: l.credit,
    })),
  );
  if (!check.isBalanced) {
    // Ne devrait jamais arriver (postingEngine.ts est testé pour toujours produire
    // des lignes équilibrées) — filet de sécurité pour ne jamais écrire une
    // écriture déséquilibrée en base, même en cas de bug futur dans postingEngine.
    throw AppError.badRequest(
      `Écriture automatique déséquilibrée pour ${params.sourceType}#${params.sourceId} — contre-passation annulée.`,
    );
  }

  const pieceNumber = await getNextPieceNumber(
    params.companyId,
    params.journal,
  );

  await prisma.journalEntry.create({
    data: {
      companyId: params.companyId,
      journal: params.journal,
      date: params.date,
      pieceNumber,
      label: params.label,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      createdById: params.createdById,
      lines: {
        create: params.lines.map((l, index) => ({
          chartOfAccountId: resolvedAccounts[index].id,
          debit: l.debit,
          credit: l.credit,
          label: l.label,
          lineOrder: index,
        })),
      },
    },
  });
}

export async function deleteEntry(entryId: string, auth: AuthenticatedUser) {
  const entry = await prisma.journalEntry.findUniqueOrThrow({
    where: { id: entryId },
  });
  await getOwnedCompanyOrThrow(entry.companyId, auth);

  if (entry.sourceType) {
    throw AppError.badRequest(
      `Cette écriture a été générée automatiquement depuis ${entry.sourceType} — elle ne peut pas être supprimée manuellement (elle disparaîtra si le document d'origine est lui-même annulé).`,
    );
  }
  await assertFiscalYearOpen(entry.companyId, entry.date);
  await prisma.journalEntry.delete({ where: { id: entryId } });

  await recordAuditLog({
    companyId: entry.companyId,
    userId: auth.userId,
    action: "DELETE",
    entityType: "JournalEntry",
    entityId: entry.id,
    entityLabel: `Écriture ${entry.pieceNumber}`,
    summary: `Supprimée : "${entry.label}"`,
  });
}

/** Grand livre d'un compte : toutes ses lignes, triées chronologiquement, avec solde cumulé. */
export async function getAccountLedger(
  accountId: string,
  auth: AuthenticatedUser,
) {
  const account = await prisma.chartOfAccount.findUniqueOrThrow({
    where: { id: accountId },
  });
  await getOwnedCompanyOrThrow(account.companyId, auth);

  const lines = await prisma.journalEntryLine.findMany({
    where: { chartOfAccountId: accountId },
    include: { journalEntry: true },
    orderBy: [{ journalEntry: { date: "asc" } }],
  });

  let runningBalance = 0;
  const rows = lines.map((l: (typeof lines)[number]) => {
    runningBalance += Number(l.debit) - Number(l.credit);
    return {
      date: l.journalEntry.date,
      pieceNumber: l.journalEntry.pieceNumber,
      label: l.label ?? l.journalEntry.label,
      debit: Number(l.debit),
      credit: Number(l.credit),
      runningBalance,
    };
  });

  return { account, lines: rows, finalBalance: runningBalance };
}

/** Balance générale (tous comptes), calculée depuis les écritures postées —
 * même forme que le résultat attendu par le moteur d'analyse financière existant. */
export async function getTrialBalance(
  companyId: string,
  auth: AuthenticatedUser,
  query: TrialBalanceQuery,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const lines = await prisma.journalEntryLine.findMany({
    where: { chartOfAccount: { companyId } },
    include: {
      journalEntry: { select: { date: true } },
      chartOfAccount: { select: { accountNumber: true, label: true } },
    },
  });

  const postedLines = lines.map((l: (typeof lines)[number]) => ({
    accountNumber: l.chartOfAccount.accountNumber,
    debit: Number(l.debit),
    credit: Number(l.credit),
    date: l.journalEntry.date,
  }));

  const periodN = { start: query.periodNStart, end: query.periodNEnd };
  const periodN1 =
    query.periodN1Start && query.periodN1End
      ? { start: query.periodN1Start, end: query.periodN1End }
      : undefined;

  const balance = computeTrialBalance(postedLines, periodN, periodN1);
  const labelByAccount = new Map<string, string>(
    lines.map((l: (typeof lines)[number]) => [
      l.chartOfAccount.accountNumber,
      l.chartOfAccount.label,
    ]),
  );

  return balance.map((b) => ({
    ...b,
    label: labelByAccount.get(b.accountNumber) ?? "",
  }));
}

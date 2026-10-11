import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { recordAuditLog } from "@/modules/auditLog/auditLog.service";
import { computeClosingEntry } from "./fiscalYearClosingEngine";
import { getNextPieceNumber } from "@/modules/accounting/journalEntries/journalEntrySequence.service";

export async function listFiscalYears(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.fiscalYearClosing.findMany({
    where: { companyId },
    include: {
      closedBy: { select: { id: true, email: true, fullName: true } },
    },
    orderBy: { fiscalYear: "desc" },
  });
}

/**
 * Lève une erreur si `date` tombe dans un exercice déjà clôturé pour cette
 * entreprise — appelée depuis les TROIS points d'entrée qui créent ou
 * suppriment une écriture (saisie manuelle, contre-passation automatique,
 * suppression). Un exercice sans ligne `FiscalYearClosing` correspondante est
 * considéré implicitement OUVERT (aucune ligne = jamais clôturé), pour ne pas
 * casser rétroactivement les entreprises déjà en cours d'utilisation avant
 * l'introduction de ce module.
 */
export async function assertFiscalYearOpen(
  companyId: string,
  date: Date,
): Promise<void> {
  const fiscalYear = date.getFullYear();
  const closing = await prisma.fiscalYearClosing.findUnique({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
  });
  if (closing) {
    throw AppError.badRequest(
      `L'exercice ${fiscalYear} est clôturé depuis le ${closing.closedAt.toLocaleDateString("fr-FR")} — aucune écriture ne peut plus y être créée, modifiée ou supprimée.`,
    );
  }
}

/**
 * Clôture l'exercice `fiscalYear` : calcule le résultat net depuis la balance
 * de l'année (1er janvier au 31 décembre), génère l'écriture de clôture qui
 * solde tous les comptes de charges et de produits vers le compte de résultat
 * (130 bénéfice ou 129 perte — voir fiscalYearClosingEngine.ts), puis
 * verrouille définitivement l'exercice. Irréversible par design : une
 * clôture n'est pas censée être annulée, seulement corrigée par une écriture
 * de régularisation sur l'exercice suivant, comme en comptabilité réelle.
 */
export async function closeFiscalYear(
  companyId: string,
  fiscalYear: number,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const existing = await prisma.fiscalYearClosing.findUnique({
    where: { companyId_fiscalYear: { companyId, fiscalYear } },
  });
  if (existing)
    throw AppError.conflict(`L'exercice ${fiscalYear} est déjà clôturé.`);

  const closingDate = new Date(fiscalYear, 11, 31, 23, 59, 59);
  const periodStart = new Date(fiscalYear, 0, 1);

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      chartOfAccount: { companyId },
      journalEntry: { date: { gte: periodStart, lte: closingDate } },
    },
    include: {
      chartOfAccount: { select: { accountNumber: true, classe: true } },
    },
  });

  const byAccount = new Map<
    string,
    { accountNumber: string; classe: string; debitN: number; creditN: number }
  >();
  for (const line of lines) {
    const key = line.chartOfAccount.accountNumber;
    if (!byAccount.has(key))
      byAccount.set(key, {
        accountNumber: key,
        classe: line.chartOfAccount.classe,
        debitN: 0,
        creditN: 0,
      });
    const acc = byAccount.get(key)!;
    acc.debitN += Number(line.debit);
    acc.creditN += Number(line.credit);
  }

  const closingResult = computeClosingEntry([...byAccount.values()]);
  if (closingResult.lines.length === 0) {
    throw AppError.badRequest(
      `Aucune écriture de charges ou de produits trouvée pour l'exercice ${fiscalYear} — rien à clôturer.`,
    );
  }

  // Les comptes 129/130 doivent exister dans le plan comptable de l'entreprise
  // pour que l'écriture de clôture puisse s'imputer — créés à la volée s'ils
  // sont absents, plutôt que de bloquer la clôture pour un défaut de configuration mineur.
  await ensureResultAccountsExist(companyId, closingResult.netResult);

  const accountsByNumber = await prisma.chartOfAccount.findMany({
    where: {
      companyId,
      accountNumber: { in: closingResult.lines.map((l) => l.accountNumber) },
    },
  });
  const accountIdByNumber = new Map(
    accountsByNumber.map((a: (typeof accountsByNumber)[number]) => [
      a.accountNumber,
      a.id,
    ]),
  );

  const missingAccounts = closingResult.lines.filter(
    (l) => !accountIdByNumber.has(l.accountNumber),
  );
  if (missingAccounts.length > 0) {
    throw AppError.badRequest(
      `Compte(s) manquant(s) dans le plan comptable pour la clôture : ${missingAccounts.map((l) => l.accountNumber).join(", ")}.`,
    );
  }

  const pieceNumber = await getNextPieceNumber(companyId, "OD");

  const closing = await prisma.$transaction(async (tx) => {
    const closingEntry = await tx.journalEntry.create({
      data: {
        companyId,
        journal: "OD",
        date: closingDate,
        pieceNumber,
        label: `Clôture de l'exercice ${fiscalYear}`,
        sourceType: "FiscalYearClosing",
        sourceId: `${companyId}-${fiscalYear}`,
        createdById: auth.userId,
        lines: {
          create: closingResult.lines.map((l, index) => ({
            chartOfAccountId: accountIdByNumber.get(l.accountNumber)!,
            debit: l.debit,
            credit: l.credit,
            lineOrder: index,
            label: `Clôture ${fiscalYear}`,
          })),
        },
      },
    });

    return tx.fiscalYearClosing.create({
      data: {
        companyId,
        fiscalYear,
        closingDate,
        netResult: closingResult.netResult,
        closingEntryId: closingEntry.id,
        closedById: auth.userId,
      },
      include: {
        closedBy: { select: { id: true, email: true, fullName: true } },
      },
    });
  });

  await recordAuditLog({
    companyId,
    userId: auth.userId,
    action: "CREATE",
    entityType: "FiscalYearClosing",
    entityId: closing.id,
    entityLabel: `Clôture de l'exercice ${fiscalYear}`,
    summary: `Résultat net : ${closingResult.netResult.toLocaleString("fr-FR")} (${closingResult.totalProduits.toLocaleString("fr-FR")} de produits − ${closingResult.totalCharges.toLocaleString("fr-FR")} de charges). Exercice désormais verrouillé.`,
  });

  return closing;
}

async function ensureResultAccountsExist(companyId: string, netResult: number) {
  const accountNumber = netResult >= 0 ? "130" : "129";
  const label =
    netResult >= 0
      ? "Résultat net de l'exercice (bénéfice)"
      : "Résultat net de l'exercice (perte)";
  const existing = await prisma.chartOfAccount.findFirst({
    where: { companyId, accountNumber },
  });
  if (!existing) {
    await prisma.chartOfAccount.create({
      data: { companyId, accountNumber, label, classe: "1" },
    });
  }
}

import { prisma } from "@/config/prisma";

const JOURNAL_PREFIXES: Record<string, string> = {
  ACHATS: "ACH",
  VENTES: "VTE",
  BANQUE: "BQ",
  CAISSE: "CAI",
  OD: "OD",
  PAIE: "PAI",
};

/**
 * Génère le prochain numéro de pièce comptable (VTE-2026-00042...) de façon
 * atomique — même principe que documentSequence.service.ts (upsert + incrément
 * en transaction), pour ne jamais produire de doublon en cas de créations concurrentes.
 */
export async function getNextPieceNumber(
  companyId: string,
  journal: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await prisma.$transaction(async (tx) => {
    const existing = await tx.journalEntrySequence.findUnique({
      where: {
        companyId_journal_year: { companyId, journal: journal as never, year },
      },
    });
    if (!existing) {
      return tx.journalEntrySequence.create({
        data: { companyId, journal: journal as never, year, lastNumber: 1 },
      });
    }
    return tx.journalEntrySequence.update({
      where: {
        companyId_journal_year: { companyId, journal: journal as never, year },
      },
      data: { lastNumber: { increment: 1 } },
    });
  });

  const prefix = JOURNAL_PREFIXES[journal] ?? "OD";
  return `${prefix}-${year}-${String(sequence.lastNumber).padStart(5, "0")}`;
}

import { prisma } from "@/config/prisma";
import {
  DOC_TYPE_PREFIXES,
  formatDocumentNumber,
} from "@/modules/invoicing/engine/documentEngine";

/**
 * Génère le prochain numéro de document (DEV-2025-001, FAC-2025-001...) de façon
 * atomique : upsert + incrément sur une table dédiée, pour éviter tout doublon
 * en cas de requêtes concurrentes (deux créations de facture au même instant).
 */
export async function getNextDocumentNumber(
  companyId: string,
  docType: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await prisma.$transaction(async (tx) => {
    const existing = await tx.documentSequence.findUnique({
      where: { companyId_docType_year: { companyId, docType, year } },
    });

    if (!existing) {
      return tx.documentSequence.create({
        data: { companyId, docType, year, lastNumber: 1 },
      });
    }

    return tx.documentSequence.update({
      where: { companyId_docType_year: { companyId, docType, year } },
      data: { lastNumber: { increment: 1 } },
    });
  });

  const prefix = DOC_TYPE_PREFIXES[docType] ?? "DOC";
  return formatDocumentNumber(prefix, year, sequence.lastNumber);
}

import { prisma } from "@/config/prisma";
import { formatDocumentNumber } from "@/modules/invoicing/engine/documentEngine";

const PURCHASE_DOC_TYPE_PREFIXES: Record<string, string> = {
  "Bon de commande": "BC",
  "Facture fournisseur": "FRN",
};

/** Même principe atomique que getNextDocumentNumber côté ventes (upsert + incrément
 * en transaction) — table de séquence dédiée pour ne jamais interférer avec la numérotation des ventes. */
export async function getNextPurchaseDocumentNumber(
  companyId: string,
  docType: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseDocumentSequence.findUnique({
      where: { companyId_docType_year: { companyId, docType, year } },
    });
    if (!existing) {
      return tx.purchaseDocumentSequence.create({
        data: { companyId, docType, year, lastNumber: 1 },
      });
    }
    return tx.purchaseDocumentSequence.update({
      where: { companyId_docType_year: { companyId, docType, year } },
      data: { lastNumber: { increment: 1 } },
    });
  });

  const prefix = PURCHASE_DOC_TYPE_PREFIXES[docType] ?? "ACH";
  return formatDocumentNumber(prefix, year, sequence.lastNumber);
}

import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";

export type PaymentDirection = "Encaissement" | "Décaissement";

export interface PaymentJournalEntry {
  id: string;
  date: Date;
  direction: PaymentDirection;
  partyName: string;
  documentNumber: string;
  documentId: string;
  documentType: "SalesDocument" | "PurchaseDocument";
  amount: number;
  method: string | null;
}

/**
 * Journal chronologique de TOUS les règlements d'une entreprise — clients
 * (encaissements) et fournisseurs (décaissements) fusionnés en une seule
 * liste triée par date, condition absente jusqu'ici : chaque règlement
 * n'était visible que dans le détail de son document d'origine, sans vue
 * d'ensemble "qu'ai-je encaissé/décaissé cette période, tous documents
 * confondus". Accès réservé aux administrateurs — même politique que les
 * autres rapports agrégés sur toute l'entreprise (recouvrement, payables,
 * dashboard facturation).
 */
export async function getPaymentsJournal(
  companyId: string,
  auth: AuthenticatedUser,
  filters: { from?: Date; to?: Date } = {},
): Promise<PaymentJournalEntry[]> {
  await getOwnedCompanyOrThrow(companyId, auth);

  const dateFilter =
    filters.from || filters.to
      ? { date: { gte: filters.from, lte: filters.to } }
      : {};

  const [clientPayments, supplierPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { document: { companyId }, ...dateFilter },
      include: {
        document: {
          select: {
            id: true,
            number: true,
            client: { select: { name: true } },
          },
        },
      },
    }),
    prisma.supplierPayment.findMany({
      where: { document: { companyId }, ...dateFilter },
      include: {
        document: {
          select: {
            id: true,
            number: true,
            supplier: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const entries: PaymentJournalEntry[] = [
    ...clientPayments.map((p: (typeof clientPayments)[number]) => ({
      id: p.id,
      date: p.date,
      direction: "Encaissement" as const,
      partyName: p.document.client?.name ?? "—",
      documentNumber: p.document.number,
      documentId: p.document.id,
      documentType: "SalesDocument" as const,
      amount: Number(p.amount),
      method: p.method,
    })),
    ...supplierPayments.map((p: (typeof supplierPayments)[number]) => ({
      id: p.id,
      date: p.date,
      direction: "Décaissement" as const,
      partyName: p.document.supplier?.name ?? "—",
      documentNumber: p.document.number,
      documentId: p.document.id,
      documentType: "PurchaseDocument" as const,
      amount: Number(p.amount),
      method: p.method,
    })),
  ];

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Module Achats & Fournisseurs. Corrige un bug réel découvert dans l'ancien
 * seed : ce module y était dupliqué intégralement (deux blocs quasi
 * identiques dans la même fonction), réutilisant les mêmes numéros de
 * document pour la même entreprise — violation garantie de
 * @@unique([companyId, number]) sur PurchaseDocument et de la clé primaire
 * composite de PurchaseDocumentSequence. Ce module n'existe désormais qu'en
 * un seul exemplaire, appelé une seule fois par entreprise.
 */
import { PrismaClient } from "@prisma/client";
import {
  buildPurchaseEntryLines,
  buildSupplierPaymentEntryLines,
} from "../../src/modules/accounting/engine/postingEngine";
import { computeDocumentTotals } from "../../src/modules/invoicing/engine/documentEngine";
import { SUPPLIER_POOL } from "./referenceData";
import { AccountRoleMap, postSeedEntry } from "./postingHelpers";
import { SeededCompany } from "./seedFoundation";
import { SeededProduct } from "./seedInvoicing";

const PAYMENT_METHODS = ["Virement", "Chèque", "Espèces"];

export async function seedPurchasing(
  prisma: PrismaClient,
  company: SeededCompany,
  roleMap: AccountRoleMap,
  products: SeededProduct[],
) {
  const suppliers = [];
  for (let i = 0; i < 6; i++) {
    const base =
      SUPPLIER_POOL[(company.companyIndex * 2 + i) % SUPPLIER_POOL.length];
    const supplier = await prisma.supplier.create({
      data: {
        companyId: company.id,
        code: `FRS-${String(i + 1).padStart(3, "0")}`,
        name: base.name,
        type: base.type,
        quality: base.quality,
        phone: `+269 76 ${String(30 + i).padStart(2, "0")} ${String(40 + i).padStart(2, "0")}${i}`,
      },
    });
    suppliers.push(supplier);
  }

  const tva = 18;
  let docCounter = 0;

  // Bons de commande : Brouillon, Confirmé, Annulé — puis un converti en facture.
  const orderStatuses = ["Confirmé", "Brouillon", "Annulé"];
  let convertibleOrderId: string | null = null;
  let convertibleOrderSupplierId: string | null = null;
  for (const status of orderStatuses) {
    docCounter += 1;
    const supplier = suppliers[docCounter % suppliers.length];
    const product = products[docCounter % products.length];
    const order = await prisma.purchaseDocument.create({
      data: {
        companyId: company.id,
        type: "Bon de commande",
        number: `BC-2026-${String(docCounter).padStart(3, "0")}`,
        supplierId: supplier.id,
        date: new Date(`2026-01-${10 + docCounter}`),
        status,
        tvaRatePercent: tva,
        lines: {
          create: [
            {
              productId: product.id,
              designation: product.designation,
              quantity: 15,
              unitPriceHT: product.unitCost ?? product.sellingPriceHT,
              lineOrder: 0,
            },
          ],
        },
      },
    });
    if (status === "Confirmé") {
      convertibleOrderId = order.id;
      convertibleOrderSupplierId = supplier.id;
    }
  }

  // Factures fournisseurs : Impayée, Partielle, Payée — contre-passées réellement.
  const invoiceSpecs = [
    { paidFraction: 0 },
    { paidFraction: 0.5 },
    { paidFraction: 1 },
  ];
  let invoiceCounter = 0;
  for (const spec of invoiceSpecs) {
    invoiceCounter += 1;
    const supplier =
      invoiceCounter === 1 && convertibleOrderSupplierId
        ? suppliers.find((s) => s.id === convertibleOrderSupplierId)!
        : suppliers[(invoiceCounter + 2) % suppliers.length];
    const product = products[(invoiceCounter + 1) % products.length];
    const lines = [
      {
        productId: product.id,
        quantity: 12,
        unitPriceHT: Number(product.unitCost ?? product.sellingPriceHT),
      },
    ];
    const totals = computeDocumentTotals(lines, tva);
    const invoiceDate = new Date(`2026-02-${5 + invoiceCounter * 3}`);

    const invoice = await prisma.purchaseDocument.create({
      data: {
        companyId: company.id,
        type: "Facture fournisseur",
        number: `FRN-2026-${String(invoiceCounter).padStart(3, "0")}`,
        supplierId: supplier.id,
        date: invoiceDate,
        status: "Impayée",
        tvaRatePercent: tva,
        linkedOrderId:
          invoiceCounter === 1 ? (convertibleOrderId ?? undefined) : undefined,
        lines: {
          create: lines.map((l, i) => ({
            productId: l.productId,
            designation: product.designation,
            quantity: l.quantity,
            unitPriceHT: l.unitPriceHT,
            lineOrder: i,
          })),
        },
      },
    });

    await postSeedEntry(prisma, {
      companyId: company.id,
      roleMap,
      journal: "ACHATS",
      date: invoiceDate,
      label: `Facture fournisseur ${invoice.number}`,
      sourceType: "PurchaseDocument",
      sourceId: invoice.id,
      createdById: company.creatorUserId,
      lines: buildPurchaseEntryLines({
        totalHT: Math.round(totals.totalHT),
        totalTVA: Math.round(totals.totalTVA),
        totalTTC: Math.round(totals.totalTTC),
      }),
    });

    if (spec.paidFraction > 0) {
      const paidAmount = Math.round(totals.totalTTC * spec.paidFraction);
      const paymentDate = new Date(
        invoiceDate.getTime() + 10 * 24 * 3600 * 1000,
      );
      const method = PAYMENT_METHODS[invoiceCounter % PAYMENT_METHODS.length];
      await prisma.supplierPayment.create({
        data: {
          documentId: invoice.id,
          amount: paidAmount,
          date: paymentDate,
          method,
        },
      });
      await postSeedEntry(prisma, {
        companyId: company.id,
        roleMap,
        journal: method === "Espèces" ? "CAISSE" : "BANQUE",
        date: paymentDate,
        label: `Règlement ${invoice.number}`,
        sourceType: "SupplierPayment",
        sourceId: `${invoice.id}-seed-payment`,
        createdById: company.creatorUserId,
        lines: buildSupplierPaymentEntryLines({
          amount: paidAmount,
          toBank: method !== "Espèces",
        }),
      });
    }
  }

  await prisma.purchaseDocumentSequence.createMany({
    data: [
      {
        companyId: company.id,
        docType: "Bon de commande",
        year: 2026,
        lastNumber: orderStatuses.length,
      },
      {
        companyId: company.id,
        docType: "Facture fournisseur",
        year: 2026,
        lastNumber: invoiceSpecs.length,
      },
    ],
  });

  return { suppliers };
}

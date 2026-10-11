/**
 * Module Facturation : clients, catalogue produits, documents commerciaux
 * couvrant tous les statuts (Devis envoyé/accepté/refusé/expiré, Facture
 * impayée/partielle/payée, un avoir), prix négociés, et contre-passation
 * comptable réelle de chaque facture/paiement/avoir via postingEngine.ts —
 * réutilisé, jamais recalculé à la main.
 */
import { PrismaClient } from "@prisma/client";
import {
  buildCreditNoteEntryLines,
  buildPaymentEntryLines,
  buildSaleEntryLines,
} from "../../src/modules/accounting/engine/postingEngine";
import { computeDocumentTotals } from "../../src/modules/invoicing/engine/documentEngine";
import { CLIENT_POOL, PRODUCT_POOL } from "./referenceData";
import { AccountRoleMap, postSeedEntry } from "./postingHelpers";
import { SeededCompany } from "./seedFoundation";

const PAYMENT_METHODS = ["Virement", "Mobile Money", "Espèces", "Chèque"];

export type SeededProduct = Awaited<
  ReturnType<PrismaClient["product"]["create"]>
>;

export async function seedInvoicing(
  prisma: PrismaClient,
  company: SeededCompany,
  roleMap: AccountRoleMap,
) {
  // ---- Clients (10 par entreprise, piochés dans le pool avec décalage pour varier) ----
  const clients = [];
  for (let i = 0; i < 10; i++) {
    const base =
      CLIENT_POOL[(company.companyIndex * 3 + i) % CLIENT_POOL.length];
    const client = await prisma.client.create({
      data: {
        companyId: company.id,
        code: `CLI-${String(i + 1).padStart(3, "0")}`,
        name: base.name,
        type: base.type,
        quality: base.quality,
        phone: `+269 76 ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")}${i}`,
        // Un tiers des clients ont une limite d'encours et/ou une remise négociée — assez pour tester ces fonctionnalités sans en faire la norme.
        creditLimit: i % 3 === 0 ? Math.round(2000000 * company.scale) : null,
        defaultDiscountPercent: i % 4 === 0 ? 5 : null,
      },
    });
    clients.push(client);
  }

  // ---- Catalogue produits (tous les articles du pool) + mouvements de stock ----
  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (let i = 0; i < PRODUCT_POOL.length; i++) {
    const base = PRODUCT_POOL[i];
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        code: `ART-${String(i + 1).padStart(3, "0")}`,
        designation: base.designation,
        unit: base.unit,
        category: base.category,
        sellingPriceHT: base.sellingPriceHT,
        unitCost: base.unitCost,
        trackInventory: base.trackInventory,
        stockMin: base.stockMin,
        stockInitial: base.stockInitial,
      },
    });
    products.push(product);
    if (base.trackInventory) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          date: new Date("2026-01-05"),
          type: "Entrée",
          quantity: 10,
          reference: "Réassort initial",
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          date: new Date("2026-02-10"),
          type: "Sortie",
          quantity: 6,
          reference: "Ventes janvier-février",
        },
      });
    }
  }

  // ---- Prix négociés (2 couples client/produit, pour les clients ayant une remise) ----
  const discountedClients = clients.filter(
    (c) => c.defaultDiscountPercent !== null,
  );
  if (discountedClients.length > 0) {
    await prisma.clientProductPrice.create({
      data: {
        clientId: discountedClients[0].id,
        productId: products[0].id,
        unitPriceHT: Math.round(Number(products[0].sellingPriceHT) * 0.85),
        notes: "Tarif volume négocié",
      },
    });
  }

  const tva = 18;

  // ---- Devis : un par statut possible (Envoyé, Accepté, Refusé, Expiré) ----
  const quoteStatuses: { status: string; date: string }[] = [
    { status: "Envoyé", date: "2026-03-01" },
    { status: "Accepté", date: "2026-01-15" },
    { status: "Refusé", date: "2026-02-05" },
    { status: "Expiré", date: "2025-11-10" },
  ];
  let docCounter = 0;
  const acceptedQuotes: { id: string; clientId: string }[] = [];
  for (const spec of quoteStatuses) {
    docCounter += 1;
    const quote = await prisma.salesDocument.create({
      data: {
        companyId: company.id,
        type: "Devis",
        number: `DEV-2026-${String(docCounter).padStart(3, "0")}`,
        clientId: clients[docCounter % clients.length].id,
        date: new Date(spec.date),
        status: spec.status,
        tvaRatePercent: tva,
        lines: {
          create: [
            {
              productId: products[0].id,
              designation: products[0].designation,
              quantity: 2,
              unitPriceHT: products[0].sellingPriceHT,
              lineOrder: 0,
            },
          ],
        },
      },
    });
    if (spec.status === "Accepté")
      acceptedQuotes.push({ id: quote.id, clientId: quote.clientId });
  }

  // ---- Factures : couvrant Impayée / Partielle / Payée + un Avoir sur l'une d'elles ----
  const invoiceSpecs = [
    { statusHint: "Impayée", paidFraction: 0 },
    { statusHint: "Partielle", paidFraction: 0.5 },
    { statusHint: "Payée", paidFraction: 1 },
    { statusHint: "Impayée-ancienne", paidFraction: 0 }, // date ancienne, pour tester les alertes de retard
  ];
  let invoiceCounter = 0;
  let firstFullyPaidInvoiceId: string | null = null;

  for (const spec of invoiceSpecs) {
    invoiceCounter += 1;
    // Cohérence métier : une facture issue d'un devis reprend le même client que ce devis.
    const linkedQuote = invoiceCounter === 1 ? acceptedQuotes[0] : undefined;
    const client = linkedQuote
      ? clients.find((c) => c.id === linkedQuote.clientId)!
      : clients[invoiceCounter % clients.length];
    const lines = [
      {
        productId: products[2].id,
        quantity: 8 + invoiceCounter,
        unitPriceHT: Number(products[2].sellingPriceHT),
      },
      {
        productId: products[4 % products.length].id,
        quantity: 1,
        unitPriceHT: Number(products[4 % products.length].sellingPriceHT),
      },
    ];
    const totals = computeDocumentTotals(lines, tva);
    const invoiceDate =
      spec.statusHint === "Impayée-ancienne"
        ? new Date("2025-10-15")
        : new Date(`2026-0${(invoiceCounter % 3) + 1}-10`);

    const invoice = await prisma.salesDocument.create({
      data: {
        companyId: company.id,
        type: "Facture",
        number: `FAC-2026-${String(invoiceCounter).padStart(3, "0")}`,
        clientId: client.id,
        date: invoiceDate,
        status:
          "Impayée" /* recalculé par le service applicatif, valeur de départ */,
        tvaRatePercent: tva,
        linkedQuoteId: linkedQuote?.id,
        lines: {
          create: lines.map((l, i) => ({
            productId: l.productId,
            designation: products.find((p) => p.id === l.productId)!
              .designation,
            quantity: l.quantity,
            unitPriceHT: l.unitPriceHT,
            lineOrder: i,
          })),
        },
      },
    });

    // Contre-passation de la vente — toujours, quel que soit le statut de paiement.
    await postSeedEntry(prisma, {
      companyId: company.id,
      roleMap,
      journal: "VENTES",
      date: invoiceDate,
      label: `Facture ${invoice.number}`,
      sourceType: "SalesDocument",
      sourceId: invoice.id,
      createdById: company.creatorUserId,
      lines: buildSaleEntryLines({
        totalHT: Math.round(totals.totalHT),
        totalTVA: Math.round(totals.totalTVA),
        totalTTC: Math.round(totals.totalTTC),
      }),
    });

    if (spec.paidFraction > 0) {
      const paidAmount = Math.round(totals.totalTTC * spec.paidFraction);
      const paymentDate = new Date(
        invoiceDate.getTime() + 8 * 24 * 3600 * 1000,
      );
      const method = PAYMENT_METHODS[invoiceCounter % PAYMENT_METHODS.length];
      await prisma.payment.create({
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
        sourceType: "Payment",
        sourceId: `${invoice.id}-seed-payment`,
        createdById: company.creatorUserId,
        lines: buildPaymentEntryLines({
          amount: paidAmount,
          toBank: method !== "Espèces",
        }),
      });
      if (spec.paidFraction === 1) firstFullyPaidInvoiceId = invoice.id;
    }

    // Bon de livraison pour la première facture, cas d'usage réel Facture -> BL.
    if (invoiceCounter === 1) {
      await prisma.salesDocument.create({
        data: {
          companyId: company.id,
          type: "Bon de livraison",
          number: `BL-2026-${String(invoiceCounter).padStart(3, "0")}`,
          clientId: invoice.clientId,
          date: new Date(invoiceDate.getTime() + 2 * 24 * 3600 * 1000),
          status: "Livré",
          tvaRatePercent: tva,
          linkedInvoiceId: invoice.id,
          lines: {
            create: lines.map((l, i) => ({
              productId: l.productId,
              designation: products.find((p) => p.id === l.productId)!
                .designation,
              quantity: l.quantity,
              quantityDelivered: l.quantity,
              unitPriceHT: l.unitPriceHT,
              lineOrder: i,
            })),
          },
        },
      });
    }
  }

  // ---- Avoir sur la facture entièrement payée (retour partiel de marchandise) ----
  if (firstFullyPaidInvoiceId) {
    const creditNoteLines = [
      { quantity: 1, unitPriceHT: Number(products[2].sellingPriceHT) },
    ];
    const creditTotals = computeDocumentTotals(creditNoteLines, tva);
    const creditDate = new Date("2026-03-20");
    const creditNote = await prisma.salesDocument.create({
      data: {
        companyId: company.id,
        type: "Avoir",
        number: `AVR-2026-001`,
        clientId: (
          await prisma.salesDocument.findUniqueOrThrow({
            where: { id: firstFullyPaidInvoiceId },
          })
        ).clientId,
        date: creditDate,
        status: "Émis",
        tvaRatePercent: tva,
        linkedInvoiceId: firstFullyPaidInvoiceId,
        lines: {
          create: [
            {
              productId: products[2].id,
              designation: products[2].designation,
              quantity: 1,
              unitPriceHT: products[2].sellingPriceHT,
              lineOrder: 0,
            },
          ],
        },
      },
    });
    await postSeedEntry(prisma, {
      companyId: company.id,
      roleMap,
      journal: "VENTES",
      date: creditDate,
      label: `Avoir ${creditNote.number}`,
      sourceType: "SalesDocument",
      sourceId: creditNote.id,
      createdById: company.creatorUserId,
      lines: buildCreditNoteEntryLines({
        totalHT: Math.round(creditTotals.totalHT),
        totalTVA: Math.round(creditTotals.totalTVA),
        totalTTC: Math.round(creditTotals.totalTTC),
      }),
    });
  }

  await prisma.documentSequence.createMany({
    data: [
      {
        companyId: company.id,
        docType: "Devis",
        year: 2026,
        lastNumber: quoteStatuses.length,
      },
      {
        companyId: company.id,
        docType: "Facture",
        year: 2026,
        lastNumber: invoiceSpecs.length,
      },
      {
        companyId: company.id,
        docType: "Bon de livraison",
        year: 2026,
        lastNumber: 1,
      },
      {
        companyId: company.id,
        docType: "Avoir",
        year: 2026,
        lastNumber: firstFullyPaidInvoiceId ? 1 : 0,
      },
    ],
  });

  return { clients, products };
}

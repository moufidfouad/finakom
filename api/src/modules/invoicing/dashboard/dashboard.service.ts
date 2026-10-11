import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import {
  computeDocumentTotals,
  computePaymentSummary,
} from "@/modules/invoicing/engine/documentEngine";
import {
  computeStock,
  sumMovements,
} from "@/modules/invoicing/engine/inventoryEngine";

export async function getInvoicingDashboard(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const [documents, clients, products] = await Promise.all([
    prisma.salesDocument.findMany({
      where: { companyId },
      include: { lines: true, payments: true },
    }),
    prisma.client.findMany({ where: { companyId } }),
    prisma.product.findMany({
      where: { companyId },
      include: { stockMovements: true },
    }),
  ]);

  const devis = documents.filter(
    (d: (typeof documents)[number]) => d.type === "Devis",
  );
  const factures = documents.filter(
    (d: (typeof documents)[number]) => d.type === "Facture",
  );
  const bonsLivraison = documents.filter(
    (d: (typeof documents)[number]) => d.type === "Bon de livraison",
  );

  const devisAcceptes = devis.filter(
    (d: (typeof devis)[number]) => d.status === "Accepté",
  );
  const devisEnAttente = devis.filter(
    (d: (typeof devis)[number]) => d.status === "Envoyé",
  );

  const factureTotals = factures.map((f: (typeof factures)[number]) => {
    const totals = computeDocumentTotals(
      f.lines.map((l: (typeof f.lines)[number]) => ({
        quantity: Number(l.quantity),
        unitPriceHT: Number(l.unitPriceHT),
      })),
      Number(f.tvaRatePercent),
    );
    const summary = computePaymentSummary(
      totals.totalTTC,
      f.payments.map((p: (typeof f.payments)[number]) => Number(p.amount)),
    );
    return { totals, summary };
  });

  const caFactureTTC = factureTotals.reduce(
    (sum: number, f: (typeof factureTotals)[number]) => sum + f.totals.totalTTC,
    0,
  );
  const caFactureHT = factureTotals.reduce(
    (sum: number, f: (typeof factureTotals)[number]) => sum + f.totals.totalHT,
    0,
  );
  const tvaCollectee = factureTotals.reduce(
    (sum: number, f: (typeof factureTotals)[number]) => sum + f.totals.totalTVA,
    0,
  );
  const encaisse = factureTotals.reduce(
    (sum: number, f: (typeof factureTotals)[number]) =>
      sum + f.summary.totalPaid,
    0,
  );
  const resteARecouvrer = factureTotals.reduce(
    (sum: number, f: (typeof factureTotals)[number]) =>
      sum + f.summary.remaining,
    0,
  );
  const facturesImpayees = factureTotals.filter(
    (f: (typeof factureTotals)[number]) => f.summary.status === "Impayée",
  ).length;
  const facturesPartielles = factureTotals.filter(
    (f: (typeof factureTotals)[number]) => f.summary.status === "Partielle",
  ).length;

  const devisEnAttenteValeur = devisEnAttente.reduce(
    (sum: number, d: (typeof devis)[number]) => {
      const totals = computeDocumentTotals(
        d.lines.map((l: (typeof d.lines)[number]) => ({
          quantity: Number(l.quantity),
          unitPriceHT: Number(l.unitPriceHT),
        })),
        Number(d.tvaRatePercent),
      );
      return sum + totals.totalTTC;
    },
    0,
  );

  const stockAlerts = products
    .filter((p: (typeof products)[number]) => p.trackInventory)
    .map((p: (typeof products)[number]) => {
      const { entries, exits } = sumMovements(
        p.stockMovements.map((m: (typeof p.stockMovements)[number]) => ({
          type: m.type,
          quantity: Number(m.quantity),
        })),
      );
      return computeStock({
        stockInitial: Number(p.stockInitial),
        entries,
        exits,
        stockMin: Number(p.stockMin),
        unitCost: Number(p.unitCost ?? 0),
      });
    });

  return {
    activite: {
      devisEmis: devis.length,
      devisAcceptes: devisAcceptes.length,
      tauxConversionDevis:
        devis.length > 0 ? devisAcceptes.length / devis.length : 0,
      facturesEmises: factures.length,
      bonsLivraison: bonsLivraison.length,
      valeurDevisEnAttente: devisEnAttenteValeur,
    },
    chiffreAffaires: {
      caFactureTTC,
      caFactureHT,
      tvaCollectee,
      factureMoyenneTTC:
        factures.length > 0 ? caFactureTTC / factures.length : 0,
      plusGrosseFacture: factureTotals.reduce(
        (max: number, f: (typeof factureTotals)[number]) =>
          Math.max(max, f.totals.totalTTC),
        0,
      ),
    },
    encaissements: {
      totalFactureTTC: caFactureTTC,
      encaisse,
      resteARecouvrer,
      tauxRecouvrement: caFactureTTC > 0 ? encaisse / caFactureTTC : 0,
      facturesImpayees,
      facturesPartielles,
    },
    catalogue: {
      clientsCount: clients.length,
      clientsEntreprises: clients.filter(
        (c: (typeof clients)[number]) => c.type === "Entreprise",
      ).length,
      articlesCount: products.length,
      prixMoyenHT:
        products.length > 0
          ? products.reduce(
              (s: number, p: (typeof products)[number]) =>
                s + Number(p.sellingPriceHT),
              0,
            ) / products.length
          : 0,
    },
    stock: {
      articlesSuivis: stockAlerts.length,
      enRupture: stockAlerts.filter(
        (s: (typeof stockAlerts)[number]) => s.alertLevel === 0,
      ).length,
      sousLeSeuil: stockAlerts.filter(
        (s: (typeof stockAlerts)[number]) => s.alertLevel === 1,
      ).length,
      valeurTotaleStock: stockAlerts.reduce(
        (sum: number, s: (typeof stockAlerts)[number]) => sum + s.stockValue,
        0,
      ),
    },
  };
}

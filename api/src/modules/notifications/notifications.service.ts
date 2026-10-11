import { prisma } from "@/config/prisma";
import { computeCashPosition } from "@/modules/treasury/engine/treasuryEngine";
import { getOrCreateTreasurySettings } from "@/modules/treasury/settings/settings.service";
import { computeStock } from "@/modules/invoicing/engine/inventoryEngine";
import {
  computeDocumentTotals,
  computePaymentSummary,
} from "@/modules/invoicing/engine/documentEngine";
import { sendAlertDigestEmail } from "@/modules/email/email.service";
import {
  Alert,
  checkExpiringContracts,
  checkLowStock,
  checkOverdueInvoices,
  checkTreasuryThreshold,
} from "./engine/checksEngine";

/**
 * Rassemble les alertes d'UNE entreprise (trésorerie, factures impayées, stock,
 * contrats CDD) — pas d'envoi d'email ici, uniquement la détection. Séparé de
 * l'envoi pour rester testable/appelable indépendamment (ex: un futur tableau
 * de bord "alertes" dans l'interface, sans avoir à envoyer un email à chaque consultation).
 */
export async function collectCompanyAlerts(
  companyId: string,
  referenceDate: Date = new Date(),
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // --- Trésorerie ---
  const [treasuryEntries, treasurySettings] = await Promise.all([
    prisma.treasuryEntry.findMany({ where: { companyId } }),
    getOrCreateTreasurySettings(companyId),
  ]);
  const movements = treasuryEntries.map(
    (e: (typeof treasuryEntries)[number]) => ({
      date: e.date,
      type: e.type as "Encaissement" | "Décaissement",
      amount: Number(e.amount),
      support: e.support,
      category: e.category,
    }),
  );
  const position = computeCashPosition(
    movements,
    Number(treasurySettings.openingCashBalance),
    Number(treasurySettings.openingBankBalance),
  );
  const treasuryAlert = checkTreasuryThreshold(
    position.totalBalance,
    Number(treasurySettings.alertThreshold),
    Number(treasurySettings.criticalThreshold),
  );
  if (treasuryAlert) alerts.push(treasuryAlert);

  // --- Factures impayées ---
  const invoices = await prisma.salesDocument.findMany({
    where: { companyId, type: "Facture" },
    include: { lines: true, payments: true },
  });
  const invoicesForCheck = invoices.map((doc: (typeof invoices)[number]) => {
    const totals = computeDocumentTotals(
      doc.lines.map((l: (typeof doc.lines)[number]) => ({
        quantity: Number(l.quantity),
        unitPriceHT: Number(l.unitPriceHT),
      })),
      Number(doc.tvaRatePercent),
    );
    const summary = computePaymentSummary(
      totals.totalTTC,
      doc.payments.map((p: (typeof doc.payments)[number]) => Number(p.amount)),
    );
    return {
      number: doc.number,
      date: doc.date,
      status: summary.status,
      totalTTC: totals.totalTTC,
      remaining: summary.remaining,
    };
  });
  alerts.push(...checkOverdueInvoices(invoicesForCheck, referenceDate));

  // --- Stock ---
  const products = await prisma.product.findMany({
    where: { companyId, trackInventory: true },
    include: { stockMovements: true },
  });
  const productsForCheck = products.map((p: (typeof products)[number]) => {
    const entries = p.stockMovements
      .filter((m: (typeof p.stockMovements)[number]) => m.type === "Entrée")
      .reduce(
        (s: number, m: (typeof p.stockMovements)[number]) =>
          s + Number(m.quantity),
        0,
      );
    const exits = p.stockMovements
      .filter((m: (typeof p.stockMovements)[number]) => m.type === "Sortie")
      .reduce(
        (s: number, m: (typeof p.stockMovements)[number]) =>
          s + Number(m.quantity),
        0,
      );
    const stock = computeStock({
      stockInitial: Number(p.stockInitial),
      entries,
      exits,
      stockMin: Number(p.stockMin),
      unitCost: Number(p.unitCost ?? p.sellingPriceHT),
    });
    return {
      code: p.code,
      designation: p.designation,
      alertLevel: stock.alertLevel,
      stockFinal: stock.stockFinal,
      stockMin: Number(p.stockMin),
    };
  });
  alerts.push(...checkLowStock(productsForCheck));

  // --- Contrats CDD arrivant à échéance ---
  const employees = await prisma.employee.findMany({
    where: { companyId, status: "Actif" },
  });
  const employeesForCheck = employees.map((e: (typeof employees)[number]) => ({
    code: e.code,
    fullName: e.fullName,
    contractType: e.contractType,
    contractEndDate: e.contractEndDate,
  }));
  alerts.push(...checkExpiringContracts(employeesForCheck, referenceDate));

  return alerts;
}

/** Envoie la synthèse d'alertes d'une entreprise à ses administrateurs
 * (créateur + membres ADMIN) — jamais aux simples membres, la sensibilité des
 * informations (trésorerie, paie) est du niveau admin, comme le reste du module RH/finance. */
export async function sendCompanyAlertDigest(
  companyId: string,
  referenceDate: Date = new Date(),
): Promise<{ alertCount: number; recipientCount: number }> {
  const alerts = await collectCompanyAlerts(companyId, referenceDate);
  if (alerts.length === 0) return { alertCount: 0, recipientCount: 0 };

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      members: {
        where: { role: "ADMIN" },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
  });

  const recipients = new Map<
    string,
    { email: string; fullName: string | null }
  >();
  recipients.set(company.user.id, company.user);
  for (const member of company.members)
    recipients.set(member.user.id, member.user);

  for (const recipient of recipients.values()) {
    await sendAlertDigestEmail(
      recipient.email,
      recipient.fullName,
      company.name,
      alerts,
    );
  }

  return { alertCount: alerts.length, recipientCount: recipients.size };
}

/** Exécute la vérification pour TOUTES les entreprises de la plateforme — cible
 * du planificateur quotidien (voir scheduler.ts) et de l'endpoint de déclenchement manuel. */
export async function runAllCompaniesAlertDigests(): Promise<
  { companyId: string; companyName: string; alertCount: number }[]
> {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  const results = [];
  for (const company of companies) {
    try {
      const { alertCount } = await sendCompanyAlertDigest(company.id);
      if (alertCount > 0)
        results.push({
          companyId: company.id,
          companyName: company.name,
          alertCount,
        });
    } catch (err) {
      console.error(
        `❌ Échec de la vérification d'alertes pour l'entreprise ${company.name} :`,
        err,
      );
    }
  }
  return results;
}

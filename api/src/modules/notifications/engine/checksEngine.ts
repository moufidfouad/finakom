/**
 * Moteur pur de détection d'alertes proactives — chaque fonction prend un état
 * déjà chargé (trésorerie, factures, stock, contrats) et renvoie la liste des
 * alertes à signaler, sans aucun accès base de données ni envoi d'email (voir
 * notifications.service.ts pour l'orchestration). Fonctions pures, testées en
 * isolation — c'est le cœur de la fiabilité d'un système d'alerte : une alerte
 * manquée ou une fausse alerte a un coût réel pour l'utilisateur qui s'y fie.
 */

export interface Alert {
  category: "TRESORERIE" | "FACTURE_IMPAYEE" | "STOCK" | "CONTRAT";
  severity: "CRITIQUE" | "ALERTE";
  message: string;
}

/** Réutilise la même logique de seuil que le tableau de bord Trésorerie
 * (computeSignal) — une seule définition de "seuil critique/alerte" dans toute
 * l'application, jamais une redéfinition parallèle susceptible de diverger. */
export function checkTreasuryThreshold(
  balance: number,
  alertThreshold: number,
  criticalThreshold: number,
): Alert | null {
  if (balance < criticalThreshold) {
    return {
      category: "TRESORERIE",
      severity: "CRITIQUE",
      message: `Trésorerie critique : solde de ${Math.round(balance).toLocaleString("fr-FR")}, sous le seuil critique de ${Math.round(criticalThreshold).toLocaleString("fr-FR")}.`,
    };
  }
  if (balance < alertThreshold) {
    return {
      category: "TRESORERIE",
      severity: "ALERTE",
      message: `Trésorerie basse : solde de ${Math.round(balance).toLocaleString("fr-FR")}, sous le seuil d'alerte de ${Math.round(alertThreshold).toLocaleString("fr-FR")}.`,
    };
  }
  return null;
}

export interface InvoiceForCheck {
  number: string;
  date: Date;
  status: "Impayée" | "Partielle" | "Payée";
  totalTTC: number;
  remaining: number;
}

/** Signale les factures non soldées émises depuis plus de `graceDays` — la
 * date d'échéance réelle (basée sur les conditions de paiement propres à
 * chaque entreprise) n'est pas modélisée : `graceDays` est un délai de courtoisie
 * raisonnable par défaut, pas une échéance contractuelle précise. */
export function checkOverdueInvoices(
  invoices: InvoiceForCheck[],
  referenceDate: Date,
  graceDays = 30,
): Alert[] {
  const alerts: Alert[] = [];
  for (const inv of invoices) {
    if (inv.status === "Payée") continue;
    const daysSinceIssue = Math.floor(
      (referenceDate.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceIssue >= graceDays) {
      alerts.push({
        category: "FACTURE_IMPAYEE",
        severity: daysSinceIssue >= graceDays * 2 ? "CRITIQUE" : "ALERTE",
        message: `Facture ${inv.number} émise il y a ${daysSinceIssue} jours, encore ${inv.status === "Partielle" ? "partiellement " : ""}impayée (reste dû : ${Math.round(inv.remaining).toLocaleString("fr-FR")}).`,
      });
    }
  }
  return alerts;
}

export interface ProductForCheck {
  code: string;
  designation: string;
  /** 0 = Rupture, 1 = Sous le seuil, 2 = OK — voir inventoryEngine.ts::computeStock
   * (l'ordre n'est PAS "0=sain, 2=grave" comme on pourrait l'attendre intuitivement). */
  alertLevel: 0 | 1 | 2;
  stockFinal: number;
  stockMin: number;
}

/** Reprend directement le niveau d'alerte déjà calculé par le moteur d'inventaire
 * (computeStock) — pas de nouveau calcul de seuil parallèle. */
export function checkLowStock(products: ProductForCheck[]): Alert[] {
  return products
    .filter((p) => p.alertLevel < 2)
    .map((p) => ({
      category: "STOCK" as const,
      severity:
        p.alertLevel === 0 ? ("CRITIQUE" as const) : ("ALERTE" as const),
      message:
        p.alertLevel === 0
          ? `Rupture de stock : ${p.code} — ${p.designation} (stock : ${p.stockFinal}).`
          : `Stock sous le seuil : ${p.code} — ${p.designation} (stock : ${p.stockFinal}, seuil : ${p.stockMin}).`,
    }));
}

export interface ContractForCheck {
  code: string;
  fullName: string;
  contractType: string;
  contractEndDate: Date | null;
}

/** Signale les contrats à durée déterminée dont la fin approche sous
 * `warningDays` — utile pour anticiper un renouvellement ou une rupture. */
export function checkExpiringContracts(
  employees: ContractForCheck[],
  referenceDate: Date,
  warningDays = 30,
): Alert[] {
  const alerts: Alert[] = [];
  for (const emp of employees) {
    if (!emp.contractType.toUpperCase().includes("CDD") || !emp.contractEndDate)
      continue;
    const daysUntilEnd = Math.floor(
      (emp.contractEndDate.getTime() - referenceDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysUntilEnd >= 0 && daysUntilEnd <= warningDays) {
      alerts.push({
        category: "CONTRAT",
        severity: daysUntilEnd <= 7 ? "CRITIQUE" : "ALERTE",
        message: `Contrat CDD de ${emp.fullName} (${emp.code}) arrive à échéance dans ${daysUntilEnd} jour(s).`,
      });
    }
  }
  return alerts;
}

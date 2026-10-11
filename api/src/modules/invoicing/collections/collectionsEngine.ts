/**
 * Moteur pur de balance âgée — réutilisé à la fois pour le recouvrement
 * client (factures de vente non soldées, "ce qui nous est dû") et pour le
 * suivi fournisseur (factures d'achat non soldées, "ce que nous devons").
 * Les mathématiques (tranches d'ancienneté, agrégation, tri par risque) sont
 * strictement identiques dans les deux cas — seule l'interprétation diffère,
 * qui reste au niveau de l'appelant (libellés, module de montage).
 * Vocabulaire neutre "partie" (partyId/partyName) plutôt que "client" pour
 * ne pas figer ce moteur à un seul des deux usages.
 *
 * L'ancienneté se calcule depuis la DATE D'ÉMISSION du document, jamais une
 * échéance théorique (paymentTermsDays) : choix délibérément aligné sur
 * checksEngine.ts::checkOverdueInvoices, qui documente déjà pourquoi une
 * échéance contractuelle précise n'est pas modélisée — deux logiques de
 * calcul de retard parallèles auraient fini par diverger silencieusement.
 */

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';
export const AGING_BUCKETS: AgingBucket[] = ['0-30', '31-60', '61-90', '90+'];

export interface InvoiceForAging {
  invoiceId: string;
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  date: Date;
  status: 'Impayée' | 'Partielle' | 'Payée';
  remaining: number;
}

export interface AgingLine {
  invoiceId: string;
  invoiceNumber: string;
  partyId: string;
  partyName: string;
  daysOverdue: number;
  bucket: AgingBucket;
  remaining: number;
  status: 'Impayée' | 'Partielle';
}

export type PartyRiskLevel = 'OK' | 'ALERTE' | 'CRITIQUE';

export interface PartyRiskSummary {
  partyId: string;
  partyName: string;
  invoiceCount: number;
  totalOutstanding: number;
  oldestInvoiceDays: number;
  bucketTotals: Record<AgingBucket, number>;
  riskLevel: PartyRiskLevel;
}

export interface AgingReport {
  lines: AgingLine[];
  byParty: PartyRiskSummary[];
  bucketTotals: Record<AgingBucket, number>;
  totalOutstanding: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function bucketFor(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 30) return '0-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

/** CRITIQUE dès qu'une facture dépasse 90 jours, ALERTE dès qu'une facture
 * dépasse 60 jours (sans atteindre 90) — au-delà, la classification se fait
 * sur la facture la PLUS ancienne, pas sur l'encours total (une partie avec
 * beaucoup de petites factures récentes n'est pas plus risquée qu'une partie
 * avec une seule vieille facture non réglée). */
function riskLevelFor(oldestInvoiceDays: number): PartyRiskLevel {
  if (oldestInvoiceDays > 90) return 'CRITIQUE';
  if (oldestInvoiceDays > 60) return 'ALERTE';
  return 'OK';
}

function emptyBucketTotals(): Record<AgingBucket, number> {
  return { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
}

export function buildAgingReport(invoices: InvoiceForAging[], referenceDate: Date): AgingReport {
  const unpaid = invoices.filter((inv) => inv.status !== 'Payée' && inv.remaining > 0);

  const lines: AgingLine[] = unpaid.map((inv) => {
    const daysOverdue = Math.max(0, Math.floor((referenceDate.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      invoiceId: inv.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      partyId: inv.partyId,
      partyName: inv.partyName,
      daysOverdue,
      bucket: bucketFor(daysOverdue),
      remaining: round2(inv.remaining),
      status: inv.status as 'Impayée' | 'Partielle',
    };
  });

  const bucketTotals = emptyBucketTotals();
  for (const line of lines) bucketTotals[line.bucket] = round2(bucketTotals[line.bucket] + line.remaining);

  const byPartyMap = new Map<string, PartyRiskSummary>();
  for (const line of lines) {
    let entry = byPartyMap.get(line.partyId);
    if (!entry) {
      entry = {
        partyId: line.partyId, partyName: line.partyName, invoiceCount: 0,
        totalOutstanding: 0, oldestInvoiceDays: 0, bucketTotals: emptyBucketTotals(), riskLevel: 'OK',
      };
      byPartyMap.set(line.partyId, entry);
    }
    entry.invoiceCount += 1;
    entry.totalOutstanding = round2(entry.totalOutstanding + line.remaining);
    entry.oldestInvoiceDays = Math.max(entry.oldestInvoiceDays, line.daysOverdue);
    entry.bucketTotals[line.bucket] = round2(entry.bucketTotals[line.bucket] + line.remaining);
  }

  const byParty = [...byPartyMap.values()]
    .map((entry) => ({ ...entry, riskLevel: riskLevelFor(entry.oldestInvoiceDays) }))
    // Le plus à risque en premier — le point d'entrée naturel d'une vraie
    // relance : commencer par la partie la plus en retard, pas par ordre alphabétique.
    .sort((a, b) => b.oldestInvoiceDays - a.oldestInvoiceDays);

  const totalOutstanding = round2(lines.reduce((sum, l) => sum + l.remaining, 0));

  return { lines, byParty, bucketTotals, totalOutstanding };
}

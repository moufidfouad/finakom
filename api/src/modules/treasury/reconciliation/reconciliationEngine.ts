/**
 * Moteur pur du rapprochement bancaire — suggestion de correspondances entre
 * les lignes du relevé bancaire et les écritures de trésorerie déjà saisies,
 * et calcul de l'écart de rapprochement. Aucun accès base de données ici (voir
 * reconciliation.service.ts). Fonctions pures, testées en isolation — un
 * rapprochement bancaire mal calculé fait perdre confiance dans tout l'outil
 * de gestion de trésorerie.
 */

export interface StatementLineForMatch {
  id: string;
  date: Date;
  amount: number; // signé : positif = crédit, négatif = débit
}

export interface TreasuryEntryForMatch {
  id: string;
  date: Date;
  amount: number; // toujours positif — le signe vient de `type`
  type: "Encaissement" | "Décaissement";
}

export interface SuggestedMatch {
  statementLineId: string;
  treasuryEntryId: string;
  confidence: "EXACT" | "PROBABLE";
}

function signedAmount(entry: TreasuryEntryForMatch): number {
  return entry.type === "Encaissement" ? entry.amount : -entry.amount;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Suggère des correspondances entre lignes de relevé non rapprochées et
 * écritures de trésorerie non rapprochées — jamais automatique de manière
 * définitive : l'utilisateur valide toujours la correspondance proposée avant
 * qu'elle ne soit enregistrée (voir reconciliation.service.ts::matchEntry).
 * EXACT = même montant, même jour. PROBABLE = même montant, écart de date
 * dans la tolérance (les banques traitent parfois une opération avec quelques
 * jours de décalage par rapport à la date de l'écriture comptable).
 * Chaque ligne/écriture n'apparaît au maximum que dans une seule suggestion
 * (la meilleure disponible), pour ne jamais proposer deux fois le même élément.
 */
export function suggestMatches(
  statementLines: StatementLineForMatch[],
  treasuryEntries: TreasuryEntryForMatch[],
  dateToleranceDays = 5,
): SuggestedMatch[] {
  const usedEntries = new Set<string>();
  const suggestions: SuggestedMatch[] = [];

  for (const line of statementLines) {
    let best: {
      entry: TreasuryEntryForMatch;
      confidence: "EXACT" | "PROBABLE";
    } | null = null;

    for (const entry of treasuryEntries) {
      if (usedEntries.has(entry.id)) continue;
      if (signedAmount(entry) !== line.amount) continue;

      const diffDays = daysBetween(line.date, entry.date);
      if (diffDays === 0) {
        best = { entry, confidence: "EXACT" };
        break; // correspondance exacte trouvée, inutile de chercher mieux
      }
      if (diffDays <= dateToleranceDays && !best) {
        best = { entry, confidence: "PROBABLE" };
      }
    }

    if (best) {
      usedEntries.add(best.entry.id);
      suggestions.push({
        statementLineId: line.id,
        treasuryEntryId: best.entry.id,
        confidence: best.confidence,
      });
    }
  }

  return suggestions;
}

export interface ReconciliationGap {
  expectedBankBalance: number;
  gap: number;
  isReconciled: boolean;
}

/**
 * Calcule l'écart de rapprochement : le solde comptable, ajusté des éléments
 * en circulation de chaque côté (écritures saisies mais pas encore sur le
 * relevé, lignes du relevé pas encore saisies en comptabilité), doit
 * théoriquement égaler le solde du relevé bancaire. Tout écart résiduel
 * signale une erreur de saisie ou un rapprochement incomplet.
 *
 * Formule : solde bancaire attendu = solde comptable
 *   + lignes du relevé non rapprochées (déjà à la banque, pas encore en compta)
 *   − écritures non rapprochées (déjà en compta, pas encore à la banque)
 */
export function computeReconciliationGap(params: {
  bookBalance: number;
  bankStatementBalance: number;
  unmatchedStatementLines: { amount: number }[];
  unreconciledBookEntries: {
    amount: number;
    type: "Encaissement" | "Décaissement";
  }[];
}): ReconciliationGap {
  const unmatchedStatementTotal = params.unmatchedStatementLines.reduce(
    (s, l) => s + l.amount,
    0,
  );
  const unreconciledBookTotal = params.unreconciledBookEntries.reduce(
    (s, e) => s + (e.type === "Encaissement" ? e.amount : -e.amount),
    0,
  );

  const expectedBankBalance =
    params.bookBalance + unmatchedStatementTotal - unreconciledBookTotal;
  const gap = round2(params.bankStatementBalance - expectedBankBalance);

  return {
    expectedBankBalance: round2(expectedBankBalance),
    gap,
    isReconciled: gap === 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Moteur pur de contrôle d'encours client — jamais bloquant par conception
 * (voir le rapport de gestion : "avertissement, pas nécessairement un blocage
 * strict"). Calcule si une nouvelle facture ferait dépasser la limite
 * d'encours autorisée pour un client, sans jamais interdire la création —
 * seul un avertissement est renvoyé, la décision finale reste à l'utilisateur.
 */

export interface CreditStatusResult {
  creditLimit: number | null; // null = aucune limite configurée pour ce client
  currentOutstanding: number; // encours actuel (somme des restes dus sur factures impayées/partielles)
  projectedOutstanding: number; // encours si la nouvelle facture est créée
  wouldExceed: boolean; // true seulement si une limite est configurée ET dépassée
  excessAmount: number; // montant du dépassement (0 si aucun dépassement ou pas de limite)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeCreditStatus(
  creditLimit: number | null,
  currentOutstanding: number,
  newInvoiceAmount: number,
): CreditStatusResult {
  const projectedOutstanding = round2(currentOutstanding + newInvoiceAmount);

  if (creditLimit === null) {
    return {
      creditLimit: null,
      currentOutstanding: round2(currentOutstanding),
      projectedOutstanding,
      wouldExceed: false,
      excessAmount: 0,
    };
  }

  const wouldExceed = projectedOutstanding > creditLimit;
  const excessAmount = wouldExceed
    ? round2(projectedOutstanding - creditLimit)
    : 0;

  return {
    creditLimit,
    currentOutstanding: round2(currentOutstanding),
    projectedOutstanding,
    wouldExceed,
    excessAmount,
  };
}

/**
 * Moteur pur de calcul du solde de congés payés — accumulation standard
 * OHADA/francophone de 2,5 jours ouvrables par mois complet travaillé (soit
 * 30 jours/an), au prorata depuis la date d'embauche. Aucun accès base de
 * données ici (voir leaveBalance.service.ts).
 */

export interface LeaveBalanceParams {
  hireDate: Date;
  asOfDate: Date;
  takenDays: number; // jours de "Congé annuel" déjà approuvés, à déduire du solde
  accrualDaysPerMonth?: number; // par défaut 2.5 (norme OHADA/francophone la plus courante)
}

export interface LeaveBalanceResult {
  monthsWorked: number;
  accruedDays: number;
  takenDays: number;
  balanceDays: number;
}

/** Nombre de mois CIVILS COMPLETS entre deux dates (ex: embauché le 15
 * janvier, au 10 mars -> 1 seul mois complet, celui du 15 janvier au 15
 * février ; le mois du 15 février au 15 mars n'est pas encore achevé). */
function fullMonthsBetween(start: Date, end: Date): number {
  if (end <= start) return 0;

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  // Si le jour du mois de fin n'a pas encore atteint le jour du mois de début,
  // le dernier mois entamé n'est pas complet.
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeLeaveBalance(
  params: LeaveBalanceParams,
): LeaveBalanceResult {
  const accrualDaysPerMonth = params.accrualDaysPerMonth ?? 2.5;
  const monthsWorked = fullMonthsBetween(params.hireDate, params.asOfDate);
  const accruedDays = round2(monthsWorked * accrualDaysPerMonth);
  const balanceDays = round2(accruedDays - params.takenDays);

  return {
    monthsWorked,
    accruedDays,
    takenDays: round2(params.takenDays),
    balanceDays,
  };
}

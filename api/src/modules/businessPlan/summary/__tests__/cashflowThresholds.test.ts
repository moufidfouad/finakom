import { describe, expect, it } from 'vitest';
import { buildCashflowSchedule } from '@/modules/businessPlan/engine/businessPlanEngine';

/**
 * Verrouille un bug corrigé avant tout déploiement : passer +Infinity comme
 * seuil d'ALERTE rendait le signal "ALERTE" en permanence (tout solde fini est
 * "< Infinity"). Le plan de trésorerie prévisionnel du business plan n'a pas de
 * seuils d'alerte : on neutralise le champ avec -Infinity des deux côtés.
 */
describe('summary.service — neutralisation des seuils de signal pour le prévisionnel', () => {
  it('ne renvoie jamais "ALERTE" ni "CRITIQUE" quand les deux seuils sont fixés à -Infinity', () => {
    const schedule = buildCashflowSchedule(
      [{ month: 1, type: 'Encaissement', amount: 1000 }, { month: 2, type: 'Décaissement', amount: 500 }],
      0,
      -Infinity,
      -Infinity
    );
    expect(schedule.every((m) => m.signal === 'OK')).toBe(true);
  });

  it('confirme que +Infinity en seuil d\'alerte est bien le bug évité (documentation du non-régression)', () => {
    const schedule = buildCashflowSchedule([{ month: 1, type: 'Encaissement', amount: 1000 }], 0, Infinity, -Infinity);
    // Comportement historique fautif, gardé ici comme preuve du problème contourné —
    // si ce test se met à échouer, c'est que la logique de computeSignal a changé
    // et qu'il faut relire la neutralisation dans summary.service.ts.
    expect(schedule[0].signal).toBe('ALERTE');
  });
});

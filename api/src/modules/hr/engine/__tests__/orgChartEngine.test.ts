import { describe, expect, it } from 'vitest';
import { buildOrgTree, wouldCreateCycle } from '../orgChartEngine';

describe('wouldCreateCycle', () => {
  it("autorise l'absence de manager", () => {
    expect(wouldCreateCycle('E1', null, [])).toBe(false);
  });

  it("rejette qu'un employé soit son propre manager", () => {
    expect(wouldCreateCycle('E1', 'E1', [])).toBe(true);
  });

  it('autorise une hiérarchie simple sans cycle', () => {
    const links = [{ id: 'E2', managerId: 'E1' }, { id: 'E1', managerId: null }];
    expect(wouldCreateCycle('E3', 'E2', links)).toBe(false);
  });

  it('détecte un cycle indirect (E1 -> E2 -> E3, on essaie de faire E3 manager de E1)', () => {
    const links = [
      { id: 'E1', managerId: null },
      { id: 'E2', managerId: 'E1' },
      { id: 'E3', managerId: 'E2' },
    ];
    // E1 tenterait de devenir subordonné de E3, qui dépend de E2, qui dépend de E1 -> cycle
    expect(wouldCreateCycle('E1', 'E3', links)).toBe(true);
  });

  it('ne boucle jamais indéfiniment même si des données corrompues contiennent déjà un cycle', () => {
    const links = [{ id: 'A', managerId: 'B' }, { id: 'B', managerId: 'A' }];
    // Vérifie juste que l'appel se termine (pas de timeout) — le résultat exact importe peu ici
    expect(() => wouldCreateCycle('C', 'A', links)).not.toThrow();
  });
});

describe('buildOrgTree', () => {
  it('place les employés sans manager à la racine', () => {
    const tree = buildOrgTree([
      { id: 'E1', fullName: 'Ahmed', position: 'Directeur', managerId: null },
      { id: 'E2', fullName: 'Halima', position: 'Directrice', managerId: null },
    ]);
    expect(tree).toHaveLength(2);
  });

  it('rattache correctement un subordonné à son manager', () => {
    const tree = buildOrgTree([
      { id: 'E1', fullName: 'Ahmed', position: 'Directeur', managerId: null },
      { id: 'E2', fullName: 'Halima', position: 'Comptable', managerId: 'E1' },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].directReports).toHaveLength(1);
    expect(tree[0].directReports[0].id).toBe('E2');
  });

  it("place en racine un employé dont le manager n'est pas dans la liste (parti de l'entreprise)", () => {
    const tree = buildOrgTree([
      { id: 'E2', fullName: 'Halima', position: 'Comptable', managerId: 'MANAGER-PARTI' },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('E2');
  });

  it('construit une hiérarchie sur plusieurs niveaux', () => {
    const tree = buildOrgTree([
      { id: 'E1', fullName: 'Directeur', position: 'DG', managerId: null },
      { id: 'E2', fullName: 'Chef comptable', position: 'Manager', managerId: 'E1' },
      { id: 'E3', fullName: 'Comptable', position: 'Employé', managerId: 'E2' },
    ]);
    expect(tree[0].directReports[0].directReports[0].id).toBe('E3');
  });
});

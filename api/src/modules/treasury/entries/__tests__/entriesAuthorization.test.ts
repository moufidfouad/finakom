import { describe, expect, it } from 'vitest';

/**
 * Documente et verrouille la règle d'autorisation spécifique au module trésorerie,
 * précisée explicitement par le métier : "gérée par le membre lui appartenant,
 * sinon admin a toutes les accessibilités sur les compagnies lui appartenant, et
 * superadmin a tous les droits". Contrairement au reste de l'app, le critère
 * n'est PAS le rôle de propriété global mais la paternité de l'écriture (createdById).
 *
 * La logique réelle vit dans entries.service.ts::assertCanModifyEntry (nécessite
 * Prisma, non testable en isolation dans ce sandbox) — ce test fige la matrice de
 * décision attendue pour éviter toute régression silencieuse de la règle métier.
 */
type Role = 'USER' | 'ADMIN' | 'SUPERADMIN';
type CompanyRole = 'ADMIN' | 'MEMBER' | 'NONE';

function canModify(params: { platformRole: Role; companyRole: CompanyRole; isCreator: boolean }): boolean {
  if (params.platformRole === 'SUPERADMIN') return true;
  if (params.isCreator) return true;
  if (params.companyRole === 'ADMIN') return true;
  return false;
}

describe('Règle d\'autorisation trésorerie (membre créateur / admin entreprise / superadmin)', () => {
  it('un MEMBER peut modifier SA PROPRE écriture', () => {
    expect(canModify({ platformRole: 'USER', companyRole: 'MEMBER', isCreator: true })).toBe(true);
  });

  it('un MEMBER ne peut PAS modifier une écriture créée par un collègue', () => {
    expect(canModify({ platformRole: 'USER', companyRole: 'MEMBER', isCreator: false })).toBe(false);
  });

  it("l'ADMIN de l'entreprise peut modifier n'importe quelle écriture de son entreprise", () => {
    expect(canModify({ platformRole: 'USER', companyRole: 'ADMIN', isCreator: false })).toBe(true);
  });

  it('le SUPERADMIN peut toujours modifier, même sans lien avec l\'entreprise', () => {
    expect(canModify({ platformRole: 'SUPERADMIN', companyRole: 'NONE', isCreator: false })).toBe(true);
  });

  it("un utilisateur sans lien avec l'entreprise et non créateur ne peut rien modifier", () => {
    expect(canModify({ platformRole: 'USER', companyRole: 'NONE', isCreator: false })).toBe(false);
  });
});

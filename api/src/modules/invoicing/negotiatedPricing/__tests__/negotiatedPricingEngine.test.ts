import { describe, expect, it } from 'vitest';
import { resolveLinePrice } from '../negotiatedPricingEngine';

describe('resolveLinePrice — ordre de priorité : négocié > remise client > catalogue', () => {
  it('sans prix négocié ni remise -> utilise le prix catalogue tel quel', () => {
    const price = resolveLinePrice({ catalogPriceHT: 10000, negotiatedPriceHT: null, clientDiscountPercent: null });
    expect(price).toBe(10000);
  });

  it('avec une remise client de 10% -> applique la remise au prix catalogue', () => {
    const price = resolveLinePrice({ catalogPriceHT: 10000, negotiatedPriceHT: null, clientDiscountPercent: 10 });
    expect(price).toBe(9000);
  });

  it('avec un prix négocié -> l\'utilise directement, ignore totalement la remise du client', () => {
    const price = resolveLinePrice({ catalogPriceHT: 10000, negotiatedPriceHT: 8500, clientDiscountPercent: 20 });
    expect(price).toBe(8500); // pas 8000 (10000 * 0.8) : le prix négocié prime, la remise n'est jamais appliquée en plus
  });

  it('remise de 0% -> ne change rien au prix catalogue (0 est une remise valide, pas "aucune remise")', () => {
    const price = resolveLinePrice({ catalogPriceHT: 10000, negotiatedPriceHT: null, clientDiscountPercent: 0 });
    expect(price).toBe(10000);
  });

  it('remise de 100% -> prix nul (cas limite extrême mais mathématiquement valide)', () => {
    const price = resolveLinePrice({ catalogPriceHT: 10000, negotiatedPriceHT: null, clientDiscountPercent: 100 });
    expect(price).toBe(0);
  });

  it('gère correctement les arrondis (évite les prix à plus de 2 décimales)', () => {
    const price = resolveLinePrice({ catalogPriceHT: 999, negotiatedPriceHT: null, clientDiscountPercent: 15 });
    expect(price).toBe(849.15); // 999 * 0.85 = 849.15 exact
  });
});

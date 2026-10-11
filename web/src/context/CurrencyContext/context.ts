import { createContext, useContext } from "react";

/**
 * Fournit la devise de l'entreprise actuellement affichée à tous ses
 * descendants — évite de faire transiter `company.currency` en prop à travers
 * des dizaines de composants imbriqués juste pour formater un montant.
 * Défaut 'XOF' uniquement comme filet de sécurité si un composant est rendu
 * hors de tout provider (ne devrait jamais arriver en usage normal).
 */
export const CurrencyContext = createContext<string>("XOF");

export function useCurrency(): string {
  return useContext(CurrencyContext);
}

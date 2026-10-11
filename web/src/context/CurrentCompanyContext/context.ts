import { createContext, useContext } from "react";
import { CurrentCompanyInfo } from "./types";

/**
 * Publie "dans quelle entreprise l'utilisateur navigue actuellement", pour
 * que la sidebar globale (AppSidebar) reste contextuelle même sur les pages
 * de détail (facture, employé, document d'achat...) qui sont en dehors de
 * CompanyDetailPage. Chaque page qui connaît l'entreprise courante (soit
 * directement via son URL, soit une fois ses données chargées) l'y publie ;
 * elle n'est jamais déduite par la sidebar elle-même pour éviter de dupliquer
 * les requêtes déjà faites par la page.
 */
export const CurrentCompanyContext = createContext<{
  company: CurrentCompanyInfo | null;
  setCurrentCompany: (company: CurrentCompanyInfo | null) => void;
}>({
  company: null,
  setCurrentCompany: () => undefined,
});

export function useCurrentCompany() {
  return useContext(CurrentCompanyContext);
}

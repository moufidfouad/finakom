import {
  BarChart3,
  FileText,
  Users,
  Package,
  TrendingUp,
  Wallet,
  Building2,
  Target,
  Briefcase,
  UserPlus,
  Settings,
  Calculator,
  Truck,
  Store,
  History,
  AlertTriangle,
  Receipt,
  MessageSquare,
  Landmark,
} from "lucide-react";

/**
 * Structure de navigation des modules d'une entreprise, groupés par famille
 * métier — définie UNE SEULE FOIS ici, réutilisée à la fois par la sidebar
 * globale (AppSidebar) et par la page de détail entreprise (CompanyDetailPage,
 * où elle pilote toujours le contenu des onglets). Toute évolution de la
 * structure de navigation (ajout/retrait/renommage d'un module) ne se fait
 * donc qu'à un seul endroit.
 */
export const COMPANY_NAV_GROUPS = [
  {
    label: "Aperçu",
    items: [{ value: "dashboard", label: "Tableau de bord", icon: BarChart3 }],
  },
  {
    label: "Commercial",
    items: [
      { value: "documents", label: "Devis & Factures", icon: FileText },
      { value: "clients", label: "Clients", icon: Users },
      { value: "products", label: "Catalogue & Stock", icon: Package },
    ],
  },
  {
    label: "Achats",
    items: [
      { value: "purchases", label: "Achats", icon: Truck },
      { value: "suppliers", label: "Fournisseurs", icon: Store },
    ],
  },
  {
    label: "Finances",
    items: [
      { value: "finance", label: "Analyse financière", icon: TrendingUp },
      { value: "accounting", label: "Comptabilité", icon: Calculator },
      { value: "treasury", label: "Trésorerie", icon: Wallet },
      { value: "payments-journal", label: "Règlements", icon: Receipt },
      { value: "collections", label: "Recouvrement", icon: AlertTriangle },
      { value: "assets", label: "Immobilisations", icon: Building2 },
      { value: "fiscalite", label: "Fiscalité", icon: Landmark },
    ],
  },
  {
    label: "Stratégie",
    items: [{ value: "business-plans", label: "Business plans", icon: Target }],
  },
  {
    label: "Équipe",
    items: [
      { value: "hr", label: "Personnel", icon: Briefcase },
      { value: "job-postings", label: "Recrutement", icon: Users },
      { value: "messages", label: "Messagerie", icon: MessageSquare },
      { value: "members", label: "Membres", icon: UserPlus },
      { value: "activity", label: "Activité", icon: History },
    ],
  },
  {
    label: "Entreprise",
    items: [{ value: "settings", label: "Paramètres", icon: Settings }],
  },
];

export function groupLabelForCompanyTab(tabValue: string): string {
  return (
    COMPANY_NAV_GROUPS.find((g) => g.items.some((i) => i.value === tabValue))
      ?.label ?? COMPANY_NAV_GROUPS[0].label
  );
}

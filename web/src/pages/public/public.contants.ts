import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  Package,
  Target,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { Variants } from "framer-motion"; // optionnel, si utilisé
import { ElementType } from "react";

// ---- Types partagés ----
type IconType = ElementType; // composant d'icône, pas un élément JSX

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
}

interface FeatureItem {
  icon: IconType;
  title: string;
  text: string;
}

interface FeatureGroup {
  category: string;
  items: FeatureItem[];
}

interface Step {
  n: string;
  title: string;
  text: string;
}

interface Module extends FeatureItem {
  // identique à FeatureItem, mais gardé pour clarté
}

interface Principle {
  title: string;
  text: string;
}

interface Role {
  title: string;
  text: string;
}

// ---- Données exportées ----

/** LANDING PAGE */
export const stats: StatItem[] = [
  { value: 9, label: "modules intégrés" },
  { value: 16, label: "ratios financiers calculés" },
  { value: 100, suffix: "%", label: "conforme SYSCOHADA révisé" },
  { value: 15, label: "thèmes de couleur" },
];

export const pillarGroups: FeatureGroup[] = [
  {
    category: "Pilotage financier",
    items: [
      {
        icon: BarChart3,
        title: "Analyse financière",
        text: "Bilan reclassé, cascade de résultat, ratios et note de santé sur 20 — conformes au référentiel SYSCOHADA révisé.",
      },
      {
        icon: Calculator,
        title: "Comptabilité générale",
        text: "Plan comptable SYSCOHADA, écritures à partie double contrôlées, grand livre, balance — contre-passation automatique des ventes, achats, paiements et paie.",
      },
      {
        icon: Wallet,
        title: "Trésorerie",
        text: "Position de caisse en temps réel, budget prévisionnel, rapprochement bancaire assisté, alertes de seuil critique.",
      },
    ],
  },
  {
    category: "Commercial",
    items: [
      {
        icon: FileText,
        title: "Facturation",
        text: "Devis, factures, avoirs et bons de livraison — numérotation automatique, prix négociés par client, export PDF en un clic.",
      },
      {
        icon: Truck,
        title: "Achats & Fournisseurs",
        text: "Répertoire fournisseurs, bons de commande et factures fournisseurs — statut calculé automatiquement, jamais saisi à la main.",
      },
      {
        icon: Package,
        title: "Inventaire",
        text: "Catalogue d'articles unifié avec la facturation — les bons de livraison génèrent automatiquement les mouvements de stock, avec alertes de seuil minimum en temps réel.",
      },
    ],
  },
  {
    category: "Patrimoine & stratégie",
    items: [
      {
        icon: Building2,
        title: "Immobilisations",
        text: "Registre SYSCOHADA, amortissements linéaires ou dégressifs calculés automatiquement, suivi des cessions.",
      },
      {
        icon: Target,
        title: "Business Plan",
        text: "Investissement de départ, compte de résultat sur 3 ans, plan de trésorerie mensuel, bilan prévisionnel — exportable en PDF.",
      },
    ],
  },
  {
    category: "Équipe",
    items: [
      {
        icon: Users,
        title: "Gestion du personnel",
        text: "Présences, paie, congés avec solde calculé automatiquement, organigramme et avenants au contrat.",
      },
    ],
  },
];

export const controlPoints: string[] = [
  "Clôture d'exercice qui verrouille définitivement les écritures — plus aucune modification rétroactive possible",
  "Émission d'avoirs liés à leur facture d'origine, avec contre-passation comptable automatique",
  "Synthèse TVA collectée / déductible, prête à reporter sur une déclaration",
  "Limite d'encours par client, avec avertissement avant d'aggraver un impayé",
  "Prix négociés et remises par client, appliqués automatiquement à la facturation",
  "Budget prévisionnel du compte de résultat, comparé au réel mois par mois",
  "Balance âgée des créances clients et des dettes fournisseurs, avec niveau de risque calculé automatiquement",
  "Journal unifié de tous les règlements — encaissements et décaissements, en une seule vue chronologique",
];

export const steps: Step[] = [
  {
    n: "01",
    title: "Créez votre entreprise",
    text: "Pays, devise, régime fiscal, système comptable — une fois, pour tous vos modules.",
  },
  {
    n: "02",
    title: "Invitez votre équipe",
    text: "Ajoutez des collaborateurs avec des droits adaptés : administrateur ou membre.",
  },
  {
    n: "03",
    title: "Pilotez au quotidien",
    text: "Tableaux de bord, alertes et documents PDF générés automatiquement.",
  },
];

// Animation (Framer Motion) – on peut utiliser Variants si importé
export const heroContainer: Variants | Record<string, any> = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const heroItem: Variants | Record<string, any> = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/** ABOUT PAGE */
export const modules: Module[] = [
  {
    icon: BarChart3,
    title: "Module financier",
    text: "Reclasse automatiquement chaque compte de la balance selon sa nature (immobilisations, stocks, créances, dettes, trésorerie) pour produire un bilan fonctionnel complet, une cascade de résultat (SIG) jusqu'à la CAFG, seize ratios avec appréciation, et une note de santé sur 20. États financiers exportables en PDF.",
  },
  {
    icon: Calculator,
    title: "Module comptabilité générale",
    text: "Plan comptable SYSCOHADA paramétrable, saisie d'écritures à partie double dont l'équilibre débit/crédit est strictement contrôlé, grand livre par compte, balance générale. Les ventes, achats, paiements et bulletins de paie génèrent automatiquement leur écriture — sans ressaisie. Clôture d'exercice qui verrouille définitivement les écritures une fois l'exercice terminé.",
  },
  {
    icon: Users,
    title: "Module personnel",
    text: "Fiche employé complète, suivi des présences, retards et congés avec solde calculé automatiquement, calcul des heures supplémentaires (majoration 25%), génération de bulletins de paie mensuels, organigramme et avenants au contrat pour tracer chaque changement de poste ou de salaire.",
  },
  {
    icon: FileText,
    title: "Module facturation",
    text: "Devis, factures, avoirs et bons de livraison avec numérotation automatique sans doublon. Le statut de paiement d'une facture est calculé à partir des paiements enregistrés, jamais saisi manuellement. Prix négociés et remises par client, limite d'encours avec avertissement. Balance âgée des créances et suivi du risque par client. Export PDF en un clic.",
  },
  {
    icon: Truck,
    title: "Module achats & fournisseurs",
    text: "Répertoire fournisseurs, bons de commande convertibles en factures fournisseurs, règlements. Le statut d'une facture fournisseur est calculé à partir des règlements enregistrés, comme pour la facturation client. Balance âgée des dettes fournisseurs, pour ne jamais perdre de vue une échéance qui traîne.",
  },
  {
    icon: Package,
    title: "Module inventaire",
    text: "Catalogue d'articles unifié avec le module facturation. Les bons de livraison génèrent automatiquement les mouvements de stock, avec alertes de seuil minimum en temps réel.",
  },
  {
    icon: Wallet,
    title: "Module trésorerie",
    text: "Journal des encaissements et décaissements, position de caisse en temps réel (banque, mobile money, espèces), budget prévisionnel avec comparaison au réel — désormais aussi pour le compte de résultat, poste par poste —, rapprochement bancaire assisté, journal unifié de tous les règlements clients et fournisseurs, et alertes automatiques dès qu'un seuil critique est franchi.",
  },
  {
    icon: Building2,
    title: "Module immobilisations",
    text: "Registre conforme SYSCOHADA : amortissement linéaire ou dégressif calculé automatiquement au prorata temporis, valeur nette comptable toujours à jour, suivi des acquisitions, cessions et mises en rebut avec calcul de la plus ou moins-value.",
  },
  {
    icon: Target,
    title: "Module Business Plan",
    text: "Montage complet : besoins et ressources de financement, compte de résultat prévisionnel sur 3 ans, plan de trésorerie mensuel, bilan prévisionnel avec indicateurs (BFR, autonomie financière, taux d'endettement), sections rédactionnelles en texte riche (étude de marché, SWOT, stratégie...). Export PDF du dossier complet.",
  },
];

export const principles: Principle[] = [
  {
    title: "Fidélité aux référentiels",
    text: "Chaque formule reproduit fidèlement les règles métier applicables : plan comptable SYSCOHADA, règles de paie, calculs commerciaux et d'amortissement.",
  },
  {
    title: "Transparence des calculs",
    text: "Aucune boîte noire : chaque montant est traçable jusqu'à la donnée source qui le compose.",
  },
  {
    title: "Statuts calculés, jamais désynchronisés",
    text: "Paiements, stock, amortissements, notes de santé : tout est recalculé à la demande depuis une source unique de vérité.",
  },
];

export const roles: Role[] = [
  {
    title: "Administrateur d'entreprise",
    text: "Créateur de l'entreprise ou promu par un autre administrateur : accès complet — paramètres, personnel, finance, trésorerie, immobilisations, et gestion des membres de l'équipe.",
  },
  {
    title: "Membre",
    text: "Ajouté par un administrateur : crée et gère ses propres devis, factures, bons de livraison et écritures de trésorerie. Ne peut pas modifier le travail d'un collègue ni accéder aux paramètres de l'entreprise.",
  },
  {
    title: "Support technique",
    text: "Accès de dépannage à l'ensemble des entreprises de la plateforme, réservé à l'équipe FINAKOM pour l'assistance et la maintenance.",
  },
];
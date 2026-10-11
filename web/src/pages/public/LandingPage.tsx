import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Check,
  FileText,
  History,
  Landmark,
  MessageSquare,
  Package,
  Palette,
  Receipt,
  ShieldCheck,
  Target,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/context/AuthContext/context";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import AuthChoiceButton from "@/components/common/AuthChoiceButton";
import AnimatedSection from "@/components/common/AnimatedSection";
import BalanceCheckWidget from "@/components/common/BalanceCheckWidget";
import CountUpStat from "@/components/common/CountUpStat";

const stats = [
  { value: 11, label: "modules intégrés" },
  { value: 16, label: "ratios financiers calculés" },
  { value: 100, suffix: "%", label: "conforme SYSCOHADA révisé" },
  { value: 15, label: "thèmes de couleur" },
];

// Regroupés par famille métier — la même organisation que la navigation
// interne de l'application, pour que la page reflète une vraie hiérarchie
// plutôt qu'une grille plate de neuf cartes au poids visuel identique.
const pillarGroups = [
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
      {
        icon: Landmark,
        title: "Fiscalité",
        text: "TVA mensuelle avec crédit reporté, IS et ses acomptes trimestriels, patente, CNPS et IR sur salaires — calendrier des échéances et récapitulatif annuel générés automatiquement.",
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
      {
        icon: Briefcase,
        title: "Recrutement",
        text: "Publiez vos offres, recevez les candidatures et parcourez l'annuaire des candidats — le recrutement rejoint la gestion RH dans le même espace.",
      },
    ],
  },
];

// Les huit chantiers construits pour un vrai pilotage comptable et
// commercial récurrent — délibérément en liste à puces courtes plutôt qu'un
// paragraphe dense, pour rester lisible d'un coup d'œil.
const controlPoints = [
  "Clôture d'exercice qui verrouille définitivement les écritures — plus aucune modification rétroactive possible",
  "Émission d'avoirs liés à leur facture d'origine, avec contre-passation comptable automatique",
  "Synthèse TVA collectée / déductible, prête à reporter sur une déclaration",
  "Limite d'encours par client, avec avertissement avant d'aggraver un impayé",
  "Prix négociés et remises par client, appliqués automatiquement à la facturation",
  "Budget prévisionnel du compte de résultat, comparé au réel mois par mois",
  "Balance âgée des créances clients et des dettes fournisseurs, avec niveau de risque calculé automatiquement",
  "Journal unifié de tous les règlements — encaissements et décaissements, en une seule vue chronologique",
];

const steps = [
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

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function LandingPage() {
  usePageMeta({
    title: "FINAKOM — Gestion, recrutement et réseau pour entreprises OHADA",
    description:
      "FINAKOM réunit gestion financière SYSCOHADA, recrutement et messagerie professionnelle pour les entreprises et candidats de l'espace OHADA.",
    path: "/",
  });
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCandidateAuthenticated } = useCandidateAuth();
  const HeroWrap = reduceMotion ? "div" : motion.div;
  const heroProps = reduceMotion
    ? {}
    : { variants: heroContainer, initial: "hidden", animate: "show" };
  const HeroItem = reduceMotion ? "div" : motion.div;
  const itemProps = reduceMotion ? {} : { variants: heroItem };

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-secondary/50 to-background">
        {/* Grille de grand livre en filigrane — ancre le fond dans le sujet
            (lignes et colonnes comptables) sans distraire, presque invisible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "64px 32px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <HeroWrap {...heroProps}>
              <HeroItem {...itemProps}>
                <Badge variant="accent" className="mb-5">
                  Conçu par une startup comorienne · Conforme SYSCOHADA révisé
                </Badge>
              </HeroItem>
              <HeroItem {...itemProps}>
                <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl md:text-5xl">
                  Votre entreprise, vos talents, votre réseau — au même endroit.
                </h1>
              </HeroItem>
              <HeroItem {...itemProps}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Gérer une entreprise dans l'espace OHADA veut souvent dire
                  jongler entre un logiciel de compta, des échanges de CV par
                  email, et des mises en relation qui se perdent dans une boîte
                  de réception. FINAKOM réunit ces trois usages dans un seul
                  espace : votre comptabilité SYSCOHADA reste rigoureuse, vos
                  recrutements avancent sans sortir de l'outil, et vos
                  conversations avec candidats ou partenaires restent tracées —
                  jamais un fil perdu ailleurs.
                </p>
              </HeroItem>
              <HeroItem {...itemProps}>
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                  <AuthChoiceButton
                    mode="register"
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto"
                    label="Essayer FINAKOM gratuitement en tant que ..."
                  />
                  <Link to="/a-propos" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Comment ça marche
                    </Button>
                  </Link>
                </div>
              </HeroItem>
            </HeroWrap>

            <HeroItem
              {...itemProps}
              className="flex justify-center lg:justify-end"
            >
              <BalanceCheckWidget />
            </HeroItem>
          </div>

          {/* Chiffres clés — bandeau d'impact immédiat, avant même de dérouler les modules */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4 lg:mx-0 lg:max-w-none">
            {stats.map((s) => (
              <CountUpStat
                key={s.label}
                value={s.value}
                suffix={s.suffix}
                label={s.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pillars — regroupés par famille métier plutôt qu'en grille plate,
          pour donner une vraie hiérarchie entre les modules */}
      <section
        id="modules"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
      >
        <AnimatedSection>
          <h2 className="text-center font-display text-2xl font-medium text-foreground sm:text-3xl">
            Onze modules, organisés comme votre activité
          </h2>
        </AnimatedSection>
        <div className="mt-12 flex flex-col gap-10">
          {pillarGroups.map((group, groupIndex) => (
            <AnimatedSection
              key={group.category}
              delay={Math.min(groupIndex * 0.08, 0.24)}
            >
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-accent">
                {group.category}
              </p>
              <div
                className={`grid gap-5 ${group.items.length === 1 ? "sm:grid-cols-1 sm:max-w-md" : group.items.length === 2 || group.items.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
              >
                {group.items.map((p) => (
                  <motion.div
                    key={p.title}
                    whileHover={reduceMotion ? undefined : { y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-primary/5">
                      <CardHeader>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <p.icon className="h-5 w-5" />
                        </div>
                        <CardTitle>{p.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {p.text}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Recrutement — seule section du site qui s'adresse aux deux publics à
          la fois (entreprises ET candidats), d'où deux CTA plutôt qu'un seul. */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection>
            <Badge variant="outline" className="mb-4">
              Nouveau
            </Badge>
            <h2 className="max-w-2xl font-display text-2xl font-medium text-foreground sm:text-3xl">
              Un seul espace pour gérer, recruter et se connecter
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              FINAKOM ne s'arrête plus à la gestion interne. Les entreprises
              publient leurs offres, consultent l'annuaire des candidats, et
              échangent directement par message — avec un candidat, ou une autre
              entreprise. Aucune coordonnée personnelle n'est jamais exposée en
              clair : chaque mise en relation passe par un canal protégé.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Link to="/offres">
                <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex items-start gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Consulter les offres d'emploi
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Découvrez les postes ouverts et postulez en ligne.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/annuaire-cv">
                <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex items-start gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Parcourir l'annuaire des candidats
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Des profils publiés librement, prêts à être contactés.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/connexion">
                <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex items-start gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Échanger par message
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Avec un candidat ou une entreprise — connectez-vous pour
                        en profiter.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contrôle & conformité — liste à puces courte plutôt qu'un paragraphe
          dense, pour un contenu qui s'est enrichi de huit chantiers */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection className="grid gap-10 lg:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
                Un pilotage comptable qui va au-delà de la saisie
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Au-delà de la comptabilité générale, FINAKOM couvre les usages
                récurrents d'un vrai suivi de gestion :
              </p>
              <ul className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-2">
                {controlPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Collaboration */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <AnimatedSection className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
              Travaillez en équipe, en toute sécurité
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ajoutez des collaborateurs à votre entreprise et attribuez-leur un
              rôle : un <strong>administrateur</strong> gère l'entreprise dans
              son ensemble (personnel, finance, paramètres), un{" "}
              <strong>membre</strong> crée et gère devis, factures et bons de
              livraison. Chaque document commercial garde la trace de son auteur
              — seuls son créateur, l'administrateur de l'entreprise ou le
              support technique peuvent le modifier ou en générer le PDF.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Traçabilité & alertes */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
                Un contrôle qui grandit avec votre équipe
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Un journal d'audit trace chaque création, modification ou
                suppression. Des alertes par email préviennent automatiquement
                d'une trésorerie basse, d'une facture impayée en retard, d'un
                stock en rupture ou d'un contrat arrivant à échéance. Toutes vos
                données s'exportent en CSV. Et si vous dirigez plusieurs
                entreprises, une vue groupe agrège trésorerie, chiffre
                d'affaires et effectif — par devise, jamais mélangés.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Personnalisation */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <AnimatedSection className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Palette className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
              Un espace de travail à votre image
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Choisissez parmi <strong>15 palettes de couleurs</strong> —
              FINAKOM, Émeraude, Saphir, Améthyste, Corail, Rose, Sable,
              Ardoise, Lagon, Cannelle, Indigo, Graphite, Olive, Sapin, Orchidée
              — chacune disponible en mode clair et sombre. Un réglage
              personnel, indépendant pour chaque utilisateur, qui ne change rien
              aux données ni aux permissions de votre équipe.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Process */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection>
            <h2 className="text-center font-display text-2xl font-medium text-foreground sm:text-3xl">
              Trois étapes pour démarrer
            </h2>
          </AnimatedSection>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {steps.map((s, i) => (
              <AnimatedSection
                key={s.n}
                delay={i * 0.1}
                className="border-t-2 border-accent pt-5"
              >
                <span className="font-display text-sm text-accent">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-medium text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
              Prêt à tout piloter au même endroit ?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              {isAuthenticated || isCandidateAuthenticated
                ? "Retrouvez vos modules et continuez là où vous vous êtes arrêté."
                : "Créez votre compte — entreprise ou candidat — et démarrez en quelques minutes. Aucune carte bancaire requise."}
            </p>
            <div className="mt-8 flex justify-center">
              {isAuthenticated ? (
                <Link to="/app">
                  <Button variant="accent" size="lg">
                    Accéder à mon espace
                  </Button>
                </Link>
              ) : isCandidateAuthenticated ? (
                <Link to="/candidat/tableau-de-bord">
                  <Button variant="accent" size="lg">
                    Accéder à mon espace
                  </Button>
                </Link>
              ) : (
                <AuthChoiceButton mode="register" variant="accent" size="lg" />
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

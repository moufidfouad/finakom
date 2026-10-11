import {
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  FileText,
  Lock,
  MapPin,
  Package,
  ShieldQuestion,
  Target,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/usePageMeta";
import AnimatedSection from "@/components/common/AnimatedSection";

// Icônes ajoutées pour rester cohérent avec LandingPage, qui en utilise
// systématiquement — cette page en était jusqu'ici dépourvue.
const modules = [
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
  {
    icon: Briefcase,
    title: "Module recrutement",
    text: "Publication d'offres d'emploi, réception des candidatures et annuaire public de CV — les candidats créent leurs CV directement dans l'outil (aucun fichier à uploader) et choisissent celui à soumettre à chaque offre. Les coordonnées personnelles ne sont jamais exposées : tout contact passe par un message relayé.",
  },
];

const principles = [
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

const roles = [
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

export default function AboutPage() {
  usePageMeta({
    title: "À propos — FINAKOM, gestion, recrutement et réseau OHADA",
    description:
      "Startup comorienne, FINAKOM réunit gestion financière SYSCOHADA, recrutement et messagerie pour les entreprises et candidats de l'espace OHADA.",
    path: "/a-propos",
  });
  const reduceMotion = useReducedMotion();
  return (
    <div>
      <section className="border-b border-border px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center sm:text-left">
          <Badge variant="outline" className="mb-4">
            À propos
          </Badge>
          <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
            Gérer, recruter, se connecter — sans changer d'outil.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            FINAKOM a commencé comme un outil de gestion financière SYSCOHADA.
            Mais gérer une entreprise, ce n'est pas que tenir ses comptes :
            c'est aussi trouver les bonnes personnes, et rester en contact avec
            elles. FINAKOM réunit aujourd'hui onze modules de gestion, un espace
            candidat à part entière, et une messagerie qui garde chaque échange
            au même endroit que le reste de votre activité — construits à partir
            d'outils métier éprouvés, sans sacrifier la rigueur des règles
            qu'ils appliquent.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection className="grid items-start gap-8 lg:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <MapPin className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-foreground">
                Une startup comorienne, pour les MPME de l'espace OHADA
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                FINAKOM est développé par une startup comorienne, avec une
                conviction simple : les micro, petites et moyennes entreprises
                (MPME) de l'archipel et de l'espace OHADA méritent des outils de
                gestion aussi rigoureux que ceux des grandes structures, sans la
                complexité ni le coût qui les accompagnent habituellement.
                Au-delà de l'outil, notre mission est aussi de vulgariser les
                normes comptables et de gestion OHADA — les rendre concrètes et
                appliquées au quotidien, pas réservées aux seuls
                experts-comptables.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <AnimatedSection>
          <h2 className="font-display text-2xl font-medium text-foreground">
            Nos modules
          </h2>
        </AnimatedSection>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {modules.map((m, i) => (
            <AnimatedSection
              key={m.title}
              delay={Math.min((i % 4) * 0.06, 0.18)}
            >
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{m.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {m.text}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-medium text-foreground">
              Travailler à plusieurs, sans perdre le contrôle
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Chaque entreprise peut accueillir plusieurs utilisateurs, chacun
              avec un rôle précis. Chaque devis, facture, bon de livraison ou
              écriture de trésorerie garde la trace de son créateur.
            </p>
          </AnimatedSection>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {roles.map((r, i) => (
              <AnimatedSection key={r.title} delay={i * 0.08}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{r.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {r.text}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection className="grid items-start gap-8 lg:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-foreground">
                Un contrôle comptable qui va au-delà de la saisie
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Au-delà de la tenue courante, huit mécanismes couvrent les
                usages d'un vrai pilotage récurrent :
              </p>
              <ul className="mt-5 grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li>
                  — Clôture d'exercice qui verrouille définitivement les
                  écritures
                </li>
                <li>
                  — Avoirs liés à leur facture d'origine, contre-passés
                  automatiquement
                </li>
                <li>— Synthèse TVA prête à reporter sur une déclaration</li>
                <li>
                  — Limite d'encours par client, avec avertissement préventif
                </li>
                <li>— Prix négociés et remises appliqués automatiquement</li>
                <li>
                  — Budget du compte de résultat comparé au réel, mois par mois
                </li>
                <li>
                  — Balance âgée des créances clients et des dettes fournisseurs
                </li>
                <li>
                  — Journal unifié des règlements, encaissements et
                  décaissements confondus
                </li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-medium text-foreground">
              Traçabilité et alertes, sans intervention manuelle
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Un journal d'audit conserve qui a créé, modifié ou supprimé chaque
              écriture comptable, document commercial ou mouvement de
              trésorerie. Une vérification quotidienne automatique envoie un
              email de synthèse dès qu'une trésorerie passe sous son seuil,
              qu'une facture reste impayée trop longtemps, qu'un article atteint
              sa rupture de stock, ou qu'un contrat à durée déterminée approche
              de son terme. Toute liste de données s'exporte en CSV pour être
              retravaillée dans Excel. Et si vous dirigez plusieurs entreprises,
              un tableau de bord groupe agrège trésorerie, chiffre d'affaires et
              effectif — toujours par devise, jamais mélangés entre entreprises
              qui n'en partagent pas une commune.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-medium text-foreground">
              Un espace de travail personnalisable
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              15 palettes de couleurs (FINAKOM, Émeraude, Saphir, Améthyste,
              Corail, Rose, Sable, Ardoise, Lagon, Cannelle, Indigo, Graphite,
              Olive, Sapin, Orchidée), chacune déclinée en mode clair et sombre.
              C'est un réglage purement personnel, propre à chaque utilisateur —
              il n'affecte ni les données de l'entreprise, ni ce que voient vos
              collègues.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-medium text-foreground">
              Nos principes
            </h2>
          </AnimatedSection>
          <div className="mt-8 space-y-8">
            {principles.map((p, i) => (
              <AnimatedSection
                key={p.title}
                delay={i * 0.08}
                className="border-l-2 border-accent pl-5"
              >
                <h3 className="font-display text-lg font-medium text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.text}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedSection className="grid items-start gap-8 lg:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <ShieldQuestion className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-foreground">
                Une limite à connaître
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                FINAKOM est un outil d'aide à la gestion : il ne remplace pas
                l'analyse d'un expert-comptable, d'un gestionnaire de paie
                agréé, ni un audit. Certains comptes SYSCOHADA (classes 42 à 47)
                peuvent apparaître à la fois à l'actif et au passif selon leur
                solde — une particularité assumée du modèle source, qui invite à
                toujours vérifier les postes sensibles avant de conclure.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

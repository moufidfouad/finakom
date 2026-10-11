import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, MapPin, ShieldCheck } from "lucide-react";
import  AuthChoiceButton  from "@/components/common/AuthChoiceButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext/context";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import Logo from "@/components/common/Logo";


// Repris de LandingPage.tsx (pillarGroups) — dix modules réels du produit,
// pas une liste décorative. Un seul lien "Voir tous les modules" vers
// l'ancre plutôt que dix liens redondants pointant tous au même endroit.
const MODULE_NAMES = [
  "Analyse financière",
  "Comptabilité générale",
  "Trésorerie",
  "Facturation",
  "Achats & Fournisseurs",
  "Inventaire",
  "Immobilisations",
  "Business Plan",
  "Personnel",
  "Recrutement",
];

export default function PublicFooter() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCandidateAuthenticated } = useCandidateAuth();
  const isSignedIn = isAuthenticated || isCandidateAuthenticated;

  return (
    <footer className="relative overflow-hidden border-t border-border bg-secondary/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "64px 32px",
        }}
      />

      {/* Bandeau CTA — visible en bas de N'IMPORTE quelle page publique, pas
          seulement l'accueil, puisque le footer leur est partagé. */}
      <div className="relative border-b border-border">
        <motion.div
          className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left"
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="font-display text-lg font-medium text-foreground sm:text-xl">
              {isSignedIn
                ? "Retrouvez vos modules au même endroit"
                : "Prêt à tout piloter au même endroit ?"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignedIn
                ? "Continuez là où vous vous êtes arrêté."
                : "Aucune carte bancaire requise pour démarrer."}
            </p>
          </div>
          {isAuthenticated ? (
            <Link to="/app">
              <Button variant="accent" size="lg" className="shrink-0">
                Accéder à mon espace
              </Button>
            </Link>
          ) : isCandidateAuthenticated ? (
            <Link to="/candidat/tableau-de-bord">
              <Button variant="accent" size="lg" className="shrink-0">
                Accéder à mon espace
              </Button>
            </Link>
          ) : (
            <AuthChoiceButton
              mode="register"
              variant="accent"
              size="lg"
              className="shrink-0"
            />
          )}
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          className="grid gap-10 sm:grid-cols-2 md:grid-cols-5"
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="sm:col-span-2 md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Analyse financière SYSCOHADA, gestion du personnel, recrutement et
              facturation — réunis dans une seule plateforme pour les
              entreprises et candidats de l'espace OHADA.
            </p>
            <Badge variant="outline" className="mt-4 gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Conforme SYSCOHADA révisé
            </Badge>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Modules
            </h3>
            <ul className="space-y-2 text-sm">
              {MODULE_NAMES.slice(0, 5).map((name) => (
                <li key={name} className="text-muted-foreground">
                  {name}
                </li>
              ))}
            </ul>
            <Link
              to="/#modules"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Voir tous les modules →
            </Link>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/a-propos"
                  className="text-muted-foreground hover:text-foreground"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  to="/offres"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Offres d'emploi
                </Link>
              </li>
              <li>
                <Link
                  to="/annuaire-entreprises"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Annuaire des entreprises
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
            <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compte
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/connexion"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Connexion
                </Link>
              </li>
              {!isSignedIn && (
                <li>
                  <Link
                    to="/inscription"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Créer un compte
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href="mailto:contact@finakom.app"
                  className="hover:text-foreground"
                >
                  contact@finakom.app
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Comores (Océan Indien) — au service de tout l'espace OHADA
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} FINAKOM — Référentiel SYSCOHADA révisé.
          </span>
          <span>Une startup comorienne, pour les MPME de l'espace OHADA.</span>
        </div>
      </div>
    </footer>
  );
}

import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ApplicationStatusWidget from "../common/ApplicationStatusWidget";
import BalanceCheckWidget from "../common/BalanceCheckWidget";
import Logo from "../common/Logo";


const COMPANY_STATS = [
  { value: "10", label: "modules" },
  { value: "100%", label: "SYSCOHADA" },
  { value: "15", label: "thèmes" },
];

const CANDIDATE_STATS = [
  { value: "∞", label: "CV créés" },
  { value: "0", label: "fichier à uploader" },
  { value: "100%", label: "coordonnées protégées" },
];

const COMPANY_QUOTE =
  "« Comptabilité verrouillée à la clôture, TVA prête à déclarer, alertes automatiques : toute la gestion, au même endroit — seul ou en équipe. »";
const CANDIDATE_QUOTE =
  "« Construisez votre CV directement dans l'outil, choisissez celui à soumettre, et suivez vos candidatures — sans jamais exposer vos coordonnées. »";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  variant = "company",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  variant?: "company" | "candidate";
}) {
  const reduceMotion = useReducedMotion();
  const stats = variant === "candidate" ? CANDIDATE_STATS : COMPANY_STATS;
  const quote = variant === "candidate" ? CANDIDATE_QUOTE : COMPANY_QUOTE;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-14">
        <Logo />
        <motion.div
          className="mx-auto w-full max-w-sm py-10"
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="font-display text-2xl font-medium text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </motion.div>
        <p className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-secondary/40 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-8 lg:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "64px 32px",
          }}
        />

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Badge variant="accent" className="gap-1.5">
            <MapPin className="h-3 w-3" />{" "}
            {variant === "candidate"
              ? "Espace candidat FINAKOM"
              : "Startup comorienne, pour les MPME de l'espace OHADA"}
          </Badge>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative"
        >
          {variant === "candidate" ? (
            <ApplicationStatusWidget />
          ) : (
            <BalanceCheckWidget />
          )}
        </motion.div>

        <motion.p
          className="relative max-w-sm text-center font-display text-xl italic leading-snug text-muted-foreground"
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {quote}
        </motion.p>

        <motion.div
          className="relative flex gap-8"
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-lg font-medium text-primary">
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

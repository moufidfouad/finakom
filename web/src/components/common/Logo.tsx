import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Symbole "Le Nœud" — trois points connectés en triangle, les trois piliers
 * du produit (gestion, recrutement, réseau) réunis en une seule forme.
 * Aucune couleur figée : les traits héritent de text-foreground (s'adapte au
 * mode clair/sombre), les nœuds de text-accent (s'adapte aux 15 thèmes de
 * couleur du produit) — jamais de hex codé en dur, cohérent avec le
 * wordmark existant qui n'en utilisait déjà aucun.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <g className="text-foreground">
        <line
          x1="24"
          y1="8"
          x2="10"
          y2="36"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="8"
          x2="38"
          y2="36"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="36"
          x2="38"
          y2="36"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <g className="text-accent" fill="currentColor">
        <circle cx="24" cy="8" r="6" />
        <circle cx="10" cy="36" r="6" />
        <circle cx="38" cy="36" r="6" />
      </g>
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("group inline-flex items-center gap-2", className)}
    >
      <LogoMark className="h-6 w-6" />
      <span className="inline-flex items-baseline gap-0.5">
        <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
          FINA
        </span>
        <span className="font-display text-2xl font-semibold italic tracking-tight text-accent">
          KOM
        </span>
      </span>
    </Link>
  );
}

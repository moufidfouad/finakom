import { Link } from "react-router-dom";
import { Briefcase, ChevronDown, Users } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useIsAuthenticatedAnywhere } from "@/hooks/useIsAuthenticatedAnywhere";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROUTES = {
  register: { company: "/inscription", candidate: "/candidat/inscription" },
  login: { company: "/connexion", candidate: "/candidat/connexion" },
} as const;

const LABELS = {
  register: { button: "S'inscrire", prompt: "Vous êtes..." },
  login: { button: "Connexion", prompt: "Se connecter en tant que..." },
} as const;

interface AuthChoiceButtonProps {
  mode: "register" | "login";
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Remplace le texte par défaut du bouton ("Essayer gratuitement" /
   * "Connexion") — utile pour un CTA de section qui veut un message plus
   * spécifique (ex: le hero) sans changer le comportement ni la logique de
   * masquage du composant partagé. */
  label?: string;
  /** Fermeture d'un panneau parent (le Sheet mobile) après le choix — sans
   * ça, le menu latéral resterait ouvert par-dessus la page de destination. */
  onNavigate?: () => void;
}

export default function AuthChoiceButton({
  mode,
  variant,
  size,
  className,
  label,
  onNavigate,
}: AuthChoiceButtonProps) {
  const isAuthenticated = useIsAuthenticatedAnywhere();
  if (mode === "register" && isAuthenticated) return null;

  const routes = ROUTES[mode];
  const labels = LABELS[mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {label ?? labels.button} <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{labels.prompt}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild onClick={onNavigate}>
          <Link to={routes.company} className="cursor-pointer">
            <Briefcase className="mr-2 h-4 w-4" /> Une entreprise
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild onClick={onNavigate}>
          <Link to={routes.candidate} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" /> Chercheur d'emploi
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

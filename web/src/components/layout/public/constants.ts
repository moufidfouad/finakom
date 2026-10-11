import { Briefcase, Building2, Home, Info, Mail, Users } from "lucide-react";
import { NavItem } from "./types";

export const navItems: NavItem[] = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  {
    to: "/offres",
    label: "Emplois",
    description: "Découvrez les opportunités",
    icon: Briefcase,
    end: false,
    //featured: true,
  },
  {
    to: "/annuaire-entreprises",
    label: "Entreprises",
    description: "Explorez les entreprises",
    icon: Building2,
    end: false,
  },
  {
    to: "/annuaire-cv",
    label: "Candidats",
    description: "Découvrez les profils",
    icon: Users,
    end: false,
  },
  { to: "/a-propos", label: "À propos", icon: Info, end: false },
  { to: "/contact", label: "Contact", icon: Mail, end: false },
];

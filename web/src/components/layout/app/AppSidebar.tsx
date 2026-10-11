import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft, 
  Building2,
  Flag,
  MessagesSquare,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext/context";
import { useCurrentCompany } from "@/context/CurrentCompanyContext/context";
import { COMPANY_NAV_GROUPS } from "@/features/companies/companyNav.constants";
import { cn } from "@/lib/utils";

const platformLinkClass = (
  { isActive }: { isActive: boolean } = { isActive: false },
) =>
  cn(
    "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  );

/**
 * Sidebar unique de l'application — remplace l'ancienne paire "AppNav
 * minimaliste (liens de plateforme) + navigation par onglets propre à
 * CompanyDetailPage". Reste visible et contextuelle sur TOUS les écrans,
 * y compris les pages de détail (facture, employé, document d'achat...) qui
 * en étaient jusqu'ici dépourvues — voir CurrentCompanyContext pour comment
 * chaque page publie l'entreprise dans laquelle elle se trouve.
 */
export default function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { company } = useCurrentCompany();
  const { companyId: companyIdFromUrl } = useParams<{ companyId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // L'onglet actif n'est déterminable précisément que sur CompanyDetailPage
  // elle-même (via ?tab=) — sur une page de détail (facture, employé...), on
  // met en évidence le groupe correspondant, sans prétendre connaître l'onglet exact.
  const isOnCompanyDetailPage =
    location.pathname === `/app/entreprises/${companyIdFromUrl}`;
  const activeTabValue = isOnCompanyDetailPage
    ? (searchParams.get("tab") ?? "dashboard")
    : null;

  if (!company) {
    return (
      <nav className="flex flex-col gap-1">
        <Link
          to="/app/entreprises"
          className={platformLinkClass({ isActive: true })}
          onClick={onNavigate}
        >
          <Building2 className="h-4 w-4" />
          Mes entreprises
        </Link>
        <Link
          to="/app/mon-compte"
          className={platformLinkClass()}
          onClick={onNavigate}
        >
          <User className="h-4 w-4" />
          Mon compte
        </Link>
        {isAdmin && (
          <Link
            to="/app/admin/messages"
            className={platformLinkClass()}
            onClick={onNavigate}
          >
            <MessagesSquare className="h-4 w-4" />
            Messages de contact
          </Link>
        )}
        {isSuperAdmin && (
          <>
            <Link
              to="/app/admin/users"
              className={platformLinkClass()}
              onClick={onNavigate}
            >
              <Users className="h-4 w-4" />
              Utilisateurs
            </Link>
            <Link
              to="/app/admin/conversation-reports"
              className={platformLinkClass()}
              onClick={onNavigate}
            >
              <Flag className="h-4 w-4" />
              Signalements
            </Link>
          </>
        )}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col">
      <Link
        to="/app/entreprises"
        className="mb-3 flex items-center gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
        onClick={onNavigate}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Toutes les entreprises
      </Link>
      <p className="mb-4 truncate px-3 text-sm font-medium text-foreground">
        {company.name}
      </p>

      {COMPANY_NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ value, label, icon: Icon }) => (
              <Link
                key={value}
                to={`/app/entreprises/${company.id}?tab=${value}`}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
                  activeTabValue === value
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-2 border-t border-border pt-3">
        <Link
          to="/app/mon-compte"
          className={platformLinkClass()}
          onClick={onNavigate}
        >
          <User className="h-4 w-4" />
          Mon compte
        </Link>
      </div>
    </nav>
  );
}

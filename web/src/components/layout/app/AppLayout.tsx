import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCurrentCompany } from "@/context/CurrentCompanyContext/context";
import CompanyNotificationBell from "@/features/companyNotifications/CompanyNotificationBell";
import { useAuth } from "@/context/AuthContext/context";
import CurrentCompanyProvider from "@/context/CurrentCompanyContext";
import AppSidebar from "./AppSidebar";
import ThemeSidebar from "@/components/common/ThemeSidebar";
import Logo from "@/components/common/Logo";

const SIDEBAR_STORAGE_KEY = "finakom-sidebar-visible";

function UserMenu({
  email,
  initials,
  onLogout,
}: {
  email: string | undefined;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-primary text-primary-foreground text-xs font-medium"
        >
          {initials}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate max-w-48">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>Se déconnecter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Groupe d'actions partagé entre les topbars desktop et mobile
 */
function AppHeaderActions({
  email,
  initials,
  onLogout,
}: {
  email: string | undefined;
  initials: string;
  onLogout: () => void;
}) {
  const { company } = useCurrentCompany();
  const [themeSidebarOpen, setThemeSidebarOpen] = useState<boolean>(false);
  return (
    <div className="flex items-center gap-1">
      {company && <CompanyNotificationBell companyId={company.id} />}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ouvrir les réglages d'affichage"
        onClick={() => setThemeSidebarOpen(true)}
      >
        <Settings className="h-5 w-5" />
      </Button>
      <UserMenu email={email} initials={initials} onLogout={onLogout} />
      <ThemeSidebar open={themeSidebarOpen} onOpenChange={setThemeSidebarOpen} />
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  // Repliable pour laisser plus de place au contenu principal (tableaux,
  // formulaires larges) — le choix de l'utilisateur est mémorisé d'une
  // session à l'autre plutôt que redemandé à chaque chargement.
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarVisible));
  }, [sidebarVisible]);

  const initials = (user?.fullName || user?.email || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <CurrentCompanyProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar desktop — largeur animée entre 0 et 256px */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col overflow-hidden border-border bg-secondary/30 transition-[width] duration-200 ease-in-out lg:flex",
            sidebarVisible ? "w-64 border-r" : "w-0 border-r-0",
          )}
        >
          <div className="flex w-64 items-center border-b border-border px-6 py-5">
            <Logo />
          </div>
          <div className="w-64 flex-1 px-4 py-6">
            <AppSidebar />
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Topbar desktop — toujours visible, indépendamment de l'état de la
            sidebar : c'est ici (pas dans la sidebar) que vivent les contrôles
            de thème et le menu utilisateur, pour ne jamais les perdre en la masquant. */}
          <header className="hidden h-14 items-center justify-between border-b border-border px-4 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarVisible((v) => !v)}
              aria-label={
                sidebarVisible ? "Masquer le menu" : "Afficher le menu"
              }
              title={sidebarVisible ? "Masquer le menu" : "Afficher le menu"}
            >
              {sidebarVisible ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <AppHeaderActions
              email={user?.email}
              initials={initials}
              onLogout={logout}
            />
          </header>

          {/* Topbar mobile */}
          <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Logo />
            <AppHeaderActions
              email={user?.email}
              initials={initials}
              onLogout={logout}
            />
          </header>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="flex w-4/5 max-w-xs flex-col">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <AppSidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </CurrentCompanyProvider>
  );
}

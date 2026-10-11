import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

import NotificationBell from "@/features/candidateNotifications/NotificationBell";
import AuthChoiceButton from "@/components/common/AuthChoiceButton";
import { useAuth } from "@/context/AuthContext/context";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import Logo from "@/components/common/Logo";
import ThemeSidebar from "@/components/common/ThemeSidebar";
import { navItems } from "./constants";
import DesktopNavLink from "./DesktopNavLink";
import CandidateUserMenu from "./CandidateUserMenu";
import MobileNavLink from "./MobileNavLink";

export default function PublicHeader() {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCandidateAuthenticated } = useCandidateAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [themeSidebarOpen, setThemeSidebarOpen] = useState<boolean>(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex h-18 max-w-350 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-42 shrink-0 items-center">
            <Logo />
          </div>

          <nav
            aria-label="Navigation principale"
            className="ml-auto hidden items-center lg:flex"
          >
            {navItems.map((item) => (
              <DesktopNavLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="ml-5 hidden items-center gap-2 border-l border-border/70 pl-5 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ouvrir les réglages d'affichage"
              onClick={() => setThemeSidebarOpen(true)}
              className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="ml-1 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-sm"
              >
                Mon espace
              </Link>
            ) : isCandidateAuthenticated ? (
              <>
                <div className="flex h-9 w-9 items-center justify-center">
                  <NotificationBell />
                </div>
                <CandidateUserMenu />
              </>
            ) : (
              <AuthChoiceButton
                mode="login"
                variant="ghost"
                size="sm"
                className="h-10 rounded-lg px-3"
              />
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ouvrir les réglages d'affichage"
              onClick={() => setThemeSidebarOpen(true)}
              className="h-10 w-10 rounded-lg"
            >
              <Settings className="h-4.5 w-4.5" />
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ouvrir le menu"
                  className="h-10 w-10 rounded-lg"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[90%] max-w-100 flex-col p-0"
              >
                <SheetHeader className="border-b px-6 py-5 text-left">
                  <SheetTitle className="flex items-center">
                    <Logo />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="mb-4 px-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Navigation
                    </p>
                  </div>
                  <nav aria-label="Navigation mobile" className="space-y-1">
                    {navItems.map((item) => (
                      <MobileNavLink key={item.to} item={item} />
                    ))}
                  </nav>
                </div>

                <div className="border-t bg-muted/20 px-5 py-5">
                  {isAuthenticated ? (
                    <SheetClose asChild>
                      <Link
                        to="/app"
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Accéder à mon espace
                      </Link>
                    </SheetClose>
                  ) : isCandidateAuthenticated ? (
                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-4">
                        <p className="text-sm font-semibold">Espace candidat</p>
                        <p className="text-xs text-muted-foreground">
                          Gérez votre candidature
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SheetClose asChild>
                          <Link
                            to="/candidat/tableau-de-bord"
                            className="flex h-10 flex-1 items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary hover:bg-primary/15"
                          >
                            Mon espace
                          </Link>
                        </SheetClose>
                        <div className="flex h-10 w-10 items-center justify-center">
                          <NotificationBell />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="mb-4 text-center text-xs text-muted-foreground">
                        Accédez à votre espace personnel
                      </p>
                      <AuthChoiceButton
                        mode="login"
                        variant="outline"
                        className="h-11 w-full rounded-xl"
                        onNavigate={() => setMobileMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <ThemeSidebar
        open={themeSidebarOpen}
        onOpenChange={setThemeSidebarOpen}
      />
    </>
  );
}

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { ChevronDown, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function CandidateUserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { candidate, logout } = useCandidateAuth();
  const initials = (candidate?.fullName || candidate?.email || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  const displayName =
    candidate?.fullName || candidate?.email?.split("@")[0] || "Candidat";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-background px-2 pr-3 transition-all duration-200 hover:border-border hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label="Ouvrir le menu utilisateur"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden max-w-27.5 truncate text-sm font-medium xl:block">
            {displayName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl p-2"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {candidate?.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          onClick={onNavigate}
          className="cursor-pointer rounded-lg"
        >
          <Link
            to="/candidat/tableau-de-bord"
            className="flex items-center gap-3"
          >
            <LayoutDashboard className="h-4 w-4" /> <span>Mon espace</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          onClick={onNavigate}
          className="cursor-pointer rounded-lg"
        >
          <Link to="/candidat/messages" className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4" /> <span>Mes messages</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
        >
          <LogOut className="mr-3 h-4 w-4" /> <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
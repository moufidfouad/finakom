import { SheetClose } from "@/components/ui/sheet";
import { NavItem } from "./types";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function MobileNavLink({ item }: { item: NavItem }) {
  return (
    <SheetClose asChild>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:bg-muted",
          )
        }
      >
        {({ isActive }) => (
          <span className="flex w-full items-center gap-2">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">{item.label}</span>
              {item.description && (
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </span>
              )}
            </span>
            {isActive && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </span>
        )}
      </NavLink>
    </SheetClose>
  );
}

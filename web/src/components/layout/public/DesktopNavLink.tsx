import { cn } from "@/lib/utils";
import { NavItem } from "./types";
import { NavLink } from "react-router-dom";

export default function DesktopNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.description || item.label}
      className={({ isActive }) =>
        cn(
          "border-l border-r gap-2 border-border/70 group relative flex h-10 items-center mx-1  rounded-lg px-3 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors duration-200",
              isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span className="relative">
            {item.label}
            <span
              className={cn(
                "absolute -bottom-2 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-primary transition-all duration-300",
                isActive ? "opacity-100 w-full" : "w-0 opacity-0",
              )}
            />
          </span>
          {item.featured && !isActive && (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
          )}
        </>
      )}
    </NavLink>
  );
}

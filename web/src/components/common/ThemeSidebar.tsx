import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Moon, Sun, SunMoon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useColorTheme } from "@/context/ColorThemeContext/context";
import { useHighContrast } from "@/context/HighContrastContext/context";

const THEME_OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: SunMoon },
] as const;

/**
 * Panneau de réglages d'apparence consolidé 
 */
export default function ThemeSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, colorThemes } = useColorTheme();
  const { highContrast, setHighContrast } = useHighContrast();

  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Apparence</SheetTitle>
          <SheetDescription>Personnalisez l'affichage du site</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Thème</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={!mounted}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors",
                    mounted && theme === option.value
                      ? "border-accent bg-accent/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80",
                  )}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Palette de couleurs
            </p>
            <div className="grid grid-cols-2 gap-2">
              {colorThemes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setColorTheme(t.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2.5 text-left text-xs transition-colors",
                    t.value === colorTheme
                      ? "border-accent bg-accent/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80",
                  )}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="flex-1 truncate">{t.label}</span>
                  {t.value === colorTheme && (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Contraste élevé
            </p>
            <button
              type="button"
              aria-pressed={highContrast}
              onClick={() => setHighContrast(!highContrast)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border p-3 text-sm transition-colors",
                highContrast
                  ? "border-accent bg-accent/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-border/80",
              )}
            >
              Activer le contraste élevé
              <span
                className={cn(
                  "h-5 w-9 shrink-0 rounded-full transition-colors",
                  highContrast ? "bg-accent" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 translate-y-0.5 rounded-full bg-background shadow transition-transform",
                    highContrast ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

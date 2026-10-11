import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useColorTheme } from "@/context/ColorThemeContext/context";

export default function ColorThemeToggle() {
  const { colorTheme, setColorTheme, colorThemes } = useColorTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Changer de palette de couleurs"
        >
          <Palette className="h-2 w-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Palette de couleurs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {colorThemes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setColorTheme(t.value)}
            className="gap-2"
          >
            <span
              className={cn(
                "h-3.5 w-3.5 shrink-0 rounded-full border border-black/10",
                t.value === colorTheme && "ring-2 ring-offset-1 ring-ring",
              )}
              style={{ backgroundColor: t.swatch }}
            />
            <span className="flex-1">{t.label}</span>
            {t.value === colorTheme && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

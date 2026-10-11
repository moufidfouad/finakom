import { Contrast } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHighContrast } from "@/context/HighContrastContext/context";

/** Simple bouton on/off — pas de menu déroulant, il n'y a que deux états.
 * Combinable avec n'importe quel mode (clair/sombre) et n'importe quelle
 * palette de couleur, sans dépendre de leur choix respectif. */
export default function HighContrastToggle() {
  const { highContrast, setHighContrast } = useHighContrast();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        highContrast
          ? "Désactiver le contraste élevé"
          : "Activer le contraste élevé"
      }
      aria-pressed={highContrast}
      onClick={() => setHighContrast(!highContrast)}
      className={cn(highContrast && "bg-secondary text-foreground")}
    >
      <Contrast className="h-2 w-2" />
    </Button>
  );
}

import { useState } from "react";
import { Cv } from "@/types";
import { useUpdateCvVisibility } from "./cv.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TEMPLATES: {
  value: Cv["template"];
  label: string;
  description: string;
}[] = [
  {
    value: "classique",
    label: "Classique",
    description:
      "Une colonne, sobre — le choix sûr pour les secteurs conservateurs.",
  },
  {
    value: "moderne",
    label: "Moderne",
    description: "Bandeau latéral avec photo, mise en page en deux colonnes.",
  },
  {
    value: "compact",
    label: "Compact",
    description:
      "Dense, dates alignées à droite — pour un parcours riche à faire tenir sur une page.",
  },
  {
    value: "chronologique",
    label: "Chronologique",
    description:
      "Ligne de temps avec repères visuels sur le parcours professionnel.",
  },
  {
    value: "deux-colonnes",
    label: "Deux colonnes sobre",
    description:
      "Structure en deux colonnes sans bandeau coloré, plus neutre à l'impression.",
  },
];

/**
 * Regroupe le gabarit et les réglages de confidentialité — séparé du
 * formulaire de contenu (CvForm), cohérent avec DirectorySettingsCard côté
 * entreprise : la présentation et la visibilité sont des décisions
 * distinctes du contenu lui-même.
 */
export default function CvSettingsDialog({
  cv,
  open,
  onOpenChange,
}: {
  cv: Cv;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateSettings = useUpdateCvVisibility();
  const [template, setTemplate] = useState(cv.template);
  const [showFullName, setShowFullName] = useState(cv.showFullName);
  const [showPhoto, setShowPhoto] = useState(cv.showPhoto);
  const [showPhone, setShowPhone] = useState(cv.showPhone);

  function handleSave() {
    updateSettings.mutate(
      {
        cvId: cv.id,
        visibility: cv.visibility,
        template,
        showFullName,
        showPhoto,
        showPhone,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Réglages du CV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div>
            <Label>Gabarit</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTemplate(t.value)}
                  className={cn(
                    "rounded-md border p-3 text-left transition-colors",
                    template === t.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-border/80",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">
                    {t.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Informations affichées si ce CV est public</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Sans effet sur le PDF que vous téléchargez — toujours complet,
              vous choisissez à qui l'envoyer.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-accent"
                  checked={showFullName}
                  onChange={(e) => setShowFullName(e.target.checked)}
                />
                Afficher mon nom complet
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-accent"
                  checked={showPhoto}
                  onChange={(e) => setShowPhoto(e.target.checked)}
                />
                Afficher ma photo
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-accent"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                />
                Afficher mon numéro de téléphone
              </label>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="accent"
            isLoading={updateSettings.isPending}
            onClick={handleSave}
          >
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

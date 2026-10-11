import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useTaxSettings, useUpdateTaxSettings } from "./fiscalite.api";
import { TaxSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";

type RateKey = Exclude<keyof TaxSettings, "id" | "companyId">;

const RATE_GROUPS: {
  title: string;
  fields: { key: RateKey; label: string; isPercent: boolean }[];
}[] = [
  {
    title: "TVA",
    fields: [
      { key: "vatStandardRate", label: "Taux normal", isPercent: true },
      { key: "vatExportRate", label: "Taux exportations", isPercent: true },
    ],
  },
  {
    title: "Impôt sur les sociétés",
    fields: [
      { key: "corporateTaxRate", label: "Taux IS", isPercent: true },
      {
        key: "corporateTaxMinRate",
        label: "IS minimum (BAIOP)",
        isPercent: true,
      },
      {
        key: "corporateTaxInstallmentRate",
        label: "Acompte trimestriel",
        isPercent: true,
      },
    ],
  },
  {
    title: "Patente & CNPS",
    fields: [
      {
        key: "businessLicenseRate",
        label: "Taux patente (droit proportionnel)",
        isPercent: true,
      },
      {
        key: "socialContribEmployerRate",
        label: "CNPS patronal",
        isPercent: true,
      },
      {
        key: "socialContribEmployeeRate",
        label: "CNPS salarial",
        isPercent: true,
      },
      {
        key: "vocationalTrainingRate",
        label: "FAC (formation)",
        isPercent: true,
      },
      {
        key: "withholdingTaxRate",
        label: "TSR (retenue source prestataires)",
        isPercent: true,
      },
    ],
  },
  {
    title: "Barème IR progressif",
    fields: [
      {
        key: "incomeTaxAllowanceRate",
        label: "Abattement forfaitaire",
        isPercent: true,
      },
      {
        key: "incomeTaxBracket1Threshold",
        label: "Tranche 1 — seuil haut",
        isPercent: false,
      },
      {
        key: "incomeTaxBracket1Rate",
        label: "Tranche 1 — taux",
        isPercent: true,
      },
      {
        key: "incomeTaxBracket2Threshold",
        label: "Tranche 2 — seuil haut",
        isPercent: false,
      },
      {
        key: "incomeTaxBracket2Rate",
        label: "Tranche 2 — taux",
        isPercent: true,
      },
      {
        key: "incomeTaxBracket3Threshold",
        label: "Tranche 3 — seuil haut",
        isPercent: false,
      },
      {
        key: "incomeTaxBracket3Rate",
        label: "Tranche 3 — taux",
        isPercent: true,
      },
      {
        key: "incomeTaxBracket4Rate",
        label: "Tranche 4 — taux (sans plafond)",
        isPercent: false,
      },
    ],
  },
];

/** Les taux stockés en base sont des fractions (0.1925 = 19,25%) — l'écran
 * affiche et édite en pourcentage, la conversion se fait aux deux bornes,
 * jamais entre les deux (pas de champ "parfois fraction, parfois %"). */
export default function TaxSettingsTab({ companyId }: { companyId: string }) {
  const { data: settings, isLoading } = useTaxSettings(companyId);
  const update = useUpdateTaxSettings(companyId);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const group of RATE_GROUPS) {
        for (const f of group.fields) {
          const raw = settings[f.key];
          const displayValue = f.isPercent ? raw * 100 : raw;
          // Arrondi à 4 décimales — évite les artefacts flottants classiques
          // (0.011 * 100 = 1.0999999999999999 en JavaScript, jamais 1.1
          // exactement) qui s'afficheraient sinon tels quels à l'utilisateur.
          initial[f.key] = String(Math.round(displayValue * 10000) / 10000);
        }
      }
      setForm(initial);
    }
  }, [settings]);

  if (isLoading || !settings) return <LoadingState />;

  function handleSave() {
    const payload: Record<string, number> = {};
    for (const group of RATE_GROUPS) {
      for (const f of group.fields) {
        const value = Number(form[f.key]);
        if (!Number.isNaN(value))
          payload[f.key] = f.isPercent ? value / 100 : value;
      }
    }
    update.mutate(payload);
  }

  return (
    <div>
      {RATE_GROUPS.map((group) => (
        <Card key={group.title} className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label>
                  {f.label} {f.isPercent && "(%)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button
        variant="accent"
        isLoading={update.isPending}
        onClick={handleSave}
      >
        <Save className="h-4 w-4" /> Enregistrer les paramètres
      </Button>
    </div>
  );
}

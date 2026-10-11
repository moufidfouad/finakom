import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useCorporateTax, useUpsertCorporateTax } from "./fiscalite.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Landmark, Wallet, Receipt, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useFormatAmount } from "@/hooks/useFormatAmount";

const FIELDS: {
  key:
    | "accountingResult"
    | "fiscalReintegrations"
    | "fiscalDeductions"
    | "priorYearLoss"
    | "annualRevenue"
    | "priorYearTax"
    | "taxCredits";
  label: string;
}[] = [
  { key: "accountingResult", label: "Résultat comptable net (avant IS)" },
  { key: "fiscalReintegrations", label: "Réintégrations fiscales" },
  { key: "fiscalDeductions", label: "Déductions fiscales" },
  { key: "priorYearLoss", label: "Déficit fiscal reporté N-1" },
  { key: "annualRevenue", label: "Chiffre d'affaires annuel HT" },
  {
    key: "priorYearTax",
    label: "IS de l'exercice précédent (base des acomptes)",
  },
  { key: "taxCredits", label: "Crédits d'impôt / retenues à la source" },
];

const INSTALLMENT_FIELDS: {
  key:
    | "installmentsPaidQ1"
    | "installmentsPaidQ2"
    | "installmentsPaidQ3"
    | "installmentsPaidQ4";
  label: string;
}[] = [
  { key: "installmentsPaidQ1", label: "T1 versé (mars)" },
  { key: "installmentsPaidQ2", label: "T2 versé (juin)" },
  { key: "installmentsPaidQ3", label: "T3 versé (septembre)" },
  { key: "installmentsPaidQ4", label: "T4 versé (décembre)" },
];

export default function CorporateTaxTab({
  companyId,
  fiscalYear,
}: {
  companyId: string;
  fiscalYear: number;
}) {
  const formatAmount = useFormatAmount();
  const { data: is, isLoading } = useCorporateTax(companyId, fiscalYear);
  const upsert = useUpsertCorporateTax(companyId, fiscalYear);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (is) {
      setForm({
        accountingResult: String(is.accountingResult),
        fiscalReintegrations: String(is.fiscalReintegrations),
        fiscalDeductions: String(is.fiscalDeductions),
        priorYearLoss: String(is.priorYearLoss),
        annualRevenue: String(is.annualRevenue),
        priorYearTax: String(is.priorYearTax),
        taxCredits: String(is.taxCredits),
        installmentsPaidQ1: String(is.installmentsPaidQ1),
        installmentsPaidQ2: String(is.installmentsPaidQ2),
        installmentsPaidQ3: String(is.installmentsPaidQ3),
        installmentsPaidQ4: String(is.installmentsPaidQ4),
      });
    }
  }, [is]);

  if (isLoading || !is) return <LoadingState />;

  function handleSave() {
    upsert.mutate({
      fiscalYear,
      accountingResult: Number(form.accountingResult) || 0,
      fiscalReintegrations: Number(form.fiscalReintegrations) || 0,
      fiscalDeductions: Number(form.fiscalDeductions) || 0,
      priorYearLoss: Number(form.priorYearLoss) || 0,
      annualRevenue: Number(form.annualRevenue) || 0,
      priorYearTax: Number(form.priorYearTax) || 0,
      taxCredits: Number(form.taxCredits) || 0,
      installmentsPaidQ1: Number(form.installmentsPaidQ1) || 0,
      installmentsPaidQ2: Number(form.installmentsPaidQ2) || 0,
      installmentsPaidQ3: Number(form.installmentsPaidQ3) || 0,
      installmentsPaidQ4: Number(form.installmentsPaidQ4) || 0,
    });
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calculator}
          label="Résultat fiscal"
          value={formatAmount(is.fiscalResult)}
        />
        <StatCard
          icon={Landmark}
          label="IS dû (MAX calculé/BAIOP)"
          value={formatAmount(is.taxDue)}
        />
        <StatCard
          icon={Wallet}
          label="Acompte trimestriel"
          value={formatAmount(is.quarterlyInstallmentAmount)}
        />
        <StatCard
          icon={Receipt}
          label="Solde fin d'exercice"
          value={formatAmount(is.yearEndBalance)}
          sub={
            is.yearEndBalance < 0
              ? "Crédit / trop-versé"
              : is.yearEndBalance > 0
                ? "Reste dû"
                : undefined
          }
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Calcul du résultat fiscal et de l'IS — exercice {fiscalYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label>{f.label}</Label>
              <Input
                type="number"
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Acomptes provisionnels trimestriels versés</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          {INSTALLMENT_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label>{f.label}</Label>
              <Input
                type="number"
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="accent"
        isLoading={upsert.isPending}
        onClick={handleSave}
      >
        <Save className="h-4 w-4" /> Enregistrer
      </Button>
    </div>
  );
}

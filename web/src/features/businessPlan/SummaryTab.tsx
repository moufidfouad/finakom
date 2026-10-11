import {
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { BusinessPlanSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useFormatAmount } from "@/hooks/useFormatAmount";
const HEALTH_VARIANT: Record<string, "success" | "accent" | "destructive"> = {
  bon: "success",
  fragile: "accent",
  desequilibre: "destructive",
};

export default function SummaryTab({
  summary,
}: {
  summary: BusinessPlanSummary;
}) {
  const formatAmount = useFormatAmount();
  const lastYear = summary.plan.horizonYears;
  const lastYearPL = summary.profitLoss.byYear[String(lastYear)];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={Target}
              label="Besoin de financement"
              value={formatAmount(summary.investmentFunding.totalInvestment)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={HandCoins}
              label="Ressources réunies"
              value={formatAmount(summary.investmentFunding.totalFunding)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={Wallet}
              label="Trésorerie fin d'année 1"
              value={formatAmount(summary.cashflow.totalYearEnd)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={TrendingUp}
              label={`Résultat net année ${lastYear}`}
              value={lastYearPL ? formatAmount(lastYearPL.resultatNet) : "—"}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-4 py-3 text-sm">
        {summary.investmentFunding.isFullyFunded ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        )}
        <p>
          {summary.investmentFunding.isFullyFunded
            ? "Financement suffisant ✅"
            : "Financement insuffisant ⚠️"}{" "}
          — solde de {formatAmount(summary.investmentFunding.balance)}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rentabilité</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {summary.profitLoss.profitabilityMessage}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {Object.entries(summary.profitLoss.byYear).map(([year, r]) => (
              <div key={year} className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Année {year}
                </p>
                <p className="tabular mt-1 text-base font-medium">
                  {formatAmount(r.resultatNet)}
                </p>
                <p className="text-xs text-muted-foreground">
                  CA : {formatAmount(r.chiffreAffaires)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Santé financière</CardTitle>
          <Badge
            variant={HEALTH_VARIANT[summary.balance.healthAppreciation.level]}
          >
            {summary.balance.healthAppreciation.level}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {summary.balance.healthAppreciation.message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

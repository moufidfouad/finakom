import { useState } from "react";
import { useVatSummary } from "./vatSummary.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";
import { LoadingState } from "@/components/ui/loading-state";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

function monthBounds(year: number, month: number): [string, string] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

export default function VatSummaryTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const [defaultStart, defaultEnd] = monthBounds(currentYear, currentMonth);
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);

  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useVatSummary(companyId, periodStart, periodEnd);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1.5">
          <Label>Début de période</Label>
          <input
            type="date"
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Fin de période</Label>
          <input
            type="date"
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading && <LoadingState />}
        {isError && (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(
              error,
              "Impossible de calculer la synthèse TVA.",
            )}
          </p>
        )}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">TVA collectée</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {summary.collectedAccount.accountNumber} —{" "}
                  {summary.collectedAccount.label}
                </p>
                <p className="tabular mt-2 text-xl font-medium">
                  {formatAmount(summary.totalCollected)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">TVA déductible</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {summary.deductibleAccount.accountNumber} —{" "}
                  {summary.deductibleAccount.label}
                </p>
                <p className="tabular mt-2 text-xl font-medium">
                  {formatAmount(summary.totalDeductible)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  {summary.isCredit ? "Crédit de TVA" : "TVA à payer"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="tabular text-xl font-semibold">
                    {formatAmount(Math.abs(summary.netVat))}
                  </p>
                  <Badge variant={summary.isCredit ? "accent" : "destructive"}>
                    {summary.isCredit ? "À reporter" : "Dû"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Calculée depuis les écritures déjà comptabilisées sur les comptes TVA
          collectée et TVA déductible — vérifiez cette synthèse avant de la
          reporter sur une déclaration officielle.
        </p>
      </div>
    </div>
  );
}

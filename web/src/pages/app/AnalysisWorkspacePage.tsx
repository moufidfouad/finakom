import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, FileText, Upload } from "lucide-react";
import { useAnalysis } from "@/features/finance/analyses.api";
import { useCompany } from "@/features/companies/companies.api";
import { usePublishCurrentCompany } from "@/hooks/usePublishCurrentCompany";
import {
  useFullReport,
  useGenerateBalanceFromLedger,
  useImportBalance,
} from "@/features/finance/report.api";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatAmount, formatDate, formatPct } from "@/lib/format";
import { apiClient } from "@/lib/axios";
import CurrencyProvider from "@/context/CurrencyContext";

function Indicator({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="tabular mt-1 text-lg font-medium text-foreground">
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AnalysisWorkspacePage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const { data: analysis } = useAnalysis(analysisId);
  const { data: company } = useCompany(analysis?.companyId);
  usePublishCurrentCompany(
    company ? { id: company.id, name: company.name } : undefined,
  );

  const { data: report, isError, error } = useFullReport(analysisId);
  const importBalance = useImportBalance(analysisId as string);
  const generateFromLedger = useGenerateBalanceFromLedger(analysisId as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Le succès/échec est notifié par toast (voir useImportBalance) — pas de gestion locale ici.
    await importBalance.mutateAsync(file).catch(() => undefined);
    e.target.value = "";
  }

  return (
    <CurrencyProvider currency={company?.currency}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to={`/app/entreprises/${analysis?.companyId ?? ""}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'entreprise
        </Link>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">
              {analysis?.label}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Clôture : {analysis && formatDate(analysis.exerciceNDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `${apiClient.defaults.baseURL}/analyses/${analysisId}/pdf`,
                    "_blank",
                  )
                }
              >
                <FileText className="h-4 w-4" /> Voir le PDF
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              isLoading={generateFromLedger.isPending}
              onClick={() => generateFromLedger.mutate()}
            >
              <Calculator className="h-4 w-4" /> Générer depuis la comptabilité
            </Button>
            <Button
              variant="accent"
              onClick={() => fileInputRef.current?.click()}
              isLoading={importBalance.isPending}
            >
              <Upload className="h-4 w-4" /> Importer une balance
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {isError && (
            <EmptyState
              icon={Calculator}
              title="Aucun résultat disponible"
              message={getApiErrorMessage(
                error,
                "Importez d'abord une balance comptable (CSV ou Excel).",
              )}
            />
          )}

          {report && (
            <div className="space-y-6">
              <Card>
                <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr]">
                  <ScoreGauge
                    score={report.synthese.noteSante.noteGlobale}
                    label={report.synthese.noteSante.appreciation}
                  />
                  <div className="grid grid-cols-2 gap-6 self-center sm:grid-cols-3">
                    <Indicator
                      label="Chiffre d'affaires"
                      value={formatAmount(
                        report.resultat.chiffreAffaires.n,
                        company?.currency,
                      )}
                    />
                    <Indicator
                      label="Résultat net"
                      value={formatAmount(
                        report.resultat.resultatNet.n,
                        company?.currency,
                      )}
                    />
                    <Indicator
                      label="CAFG"
                      value={formatAmount(
                        report.resultat.cafg.n,
                        company?.currency,
                      )}
                    />
                    <Indicator
                      label="Trésorerie nette"
                      value={formatAmount(
                        report.bilan.equilibreFonctionnel.tresorerieNette.n,
                        company?.currency,
                      )}
                    />
                    <Indicator
                      label="Fonds de roulement"
                      value={formatAmount(
                        report.bilan.equilibreFonctionnel.fondsDeRoulement.n,
                        company?.currency,
                      )}
                    />
                    <Indicator
                      label="Total actif"
                      value={formatAmount(
                        report.bilan.actif.totalGeneralActif.n,
                        company?.currency,
                      )}
                      sub={formatPct(
                        report.bilan.actif.totalGeneralActif.variationPct,
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Points de vigilance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.synthese.pointsDeVigilance.map((p, i) => (
                      <li
                        key={i}
                        className={`text-sm ${p.ok ? "text-muted-foreground" : "font-medium text-destructive"}`}
                      >
                        {p.message}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {!report.controles.ecartDebitCredit.equilibre && (
                <p className="text-sm text-destructive">
                  ⚠ La balance importée n'est pas équilibrée (Débit ≠ Crédit) —
                  vérifiez votre fichier source.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </CurrencyProvider>
  );
}

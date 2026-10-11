import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  Link2,
  Upload,
  XCircle,
} from "lucide-react";
import { BankStatementLine } from "@/types";
import {
  useImportStatement,
  useMatchStatementLine,
  useReconciliationSummary,
  useStatementLines,
  useSuggestedMatches,
  useUnmatchStatementLine,
} from "./reconciliation.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { LoadingState } from "@/components/ui/loading-state";

export default function ReconciliationTab({
  companyId,
}: {
  companyId: string;
}) {
  const formatAmount = useFormatAmount();
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(true);
  const [bankBalanceInput, setBankBalanceInput] = useState("");
  const bankStatementBalance =
    bankBalanceInput === "" ? null : Number(bankBalanceInput);

  const { data: lines, isLoading } = useStatementLines(
    companyId,
    showUnmatchedOnly,
  );
  const { data: suggestions } = useSuggestedMatches(companyId);
  const { data: summary } = useReconciliationSummary(
    companyId,
    bankStatementBalance,
  );
  const importStatement = useImportStatement(companyId);
  const matchLine = useMatchStatementLine(companyId);
  const unmatchLine = useUnmatchStatementLine(companyId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await importStatement.mutateAsync(file).catch(() => undefined);
    e.target.value = "";
  }

  const suggestionForLine = (lineId: string) =>
    suggestions?.find((s) => s.statementLineId === lineId);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <Landmark className="h-4 w-4" /> Rapprochement bancaire
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Importez votre relevé bancaire et rapprochez-le avec les écritures
            déjà saisies.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="accent"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={importStatement.isPending}
          >
            <Upload className="h-4 w-4" /> Importer un relevé
          </Button>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Écart de rapprochement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5 sm:w-64">
            <Label>Solde du relevé bancaire (à la date d'aujourd'hui)</Label>
            <input
              type="number"
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              placeholder="Ex : 1 450 000"
              value={bankBalanceInput}
              onChange={(e) => setBankBalanceInput(e.target.value)}
            />
          </div>

          {summary && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Solde comptable
                </p>
                <p className="tabular mt-1 text-lg font-medium">
                  {formatAmount(summary.bookBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Solde relevé
                </p>
                <p className="tabular mt-1 text-lg font-medium">
                  {formatAmount(summary.bankStatementBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Solde attendu
                </p>
                <p className="tabular mt-1 text-lg font-medium">
                  {formatAmount(summary.expectedBankBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Écart
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="tabular text-lg font-medium">
                    {formatAmount(summary.gap)}
                  </p>
                  <Badge
                    variant={summary.isReconciled ? "success" : "destructive"}
                  >
                    {summary.isReconciled ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {summary.isReconciled ? "Équilibré" : "Écart"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => setShowUnmatchedOnly(true)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${showUnmatchedOnly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Non rapprochées
          </button>
          <button
            type="button"
            onClick={() => setShowUnmatchedOnly(false)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${!showUnmatchedOnly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Toutes
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState />}
        {lines && lines.length === 0 && (
          <EmptyState
            icon={FileSpreadsheet}
            message="Aucune ligne de relevé — importez un fichier pour commencer."
          />
        )}
        {lines && lines.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Rapprochement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line: BankStatementLine) => {
                  const suggestion = suggestionForLine(line.id);
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(line.date)}
                      </TableCell>
                      <TableCell>{line.label}</TableCell>
                      <TableCell
                        className={`tabular text-right font-medium ${Number(line.amount) >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {formatAmount(Number(line.amount))}
                      </TableCell>
                      <TableCell>
                        {line.matchedEntry ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success">
                              <Link2 className="h-3 w-3" />{" "}
                              {line.matchedEntry.label}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => unmatchLine.mutate(line.id)}
                            >
                              Annuler
                            </Button>
                          </div>
                        ) : suggestion ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                suggestion.confidence === "EXACT"
                                  ? "accent"
                                  : "secondary"
                              }
                            >
                              Suggestion{" "}
                              {suggestion.confidence === "EXACT"
                                ? "exacte"
                                : "probable"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                matchLine.mutate({
                                  statementLineId: line.id,
                                  treasuryEntryId: suggestion.treasuryEntryId,
                                })
                              }
                            >
                              Valider
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Aucune correspondance trouvée
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

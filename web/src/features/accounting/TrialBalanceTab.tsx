import { useState } from "react";
import { Download, BookOpen } from "lucide-react";
import { useTrialBalance } from "./journalEntries.api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { apiClient } from "@/lib/axios";
import { LoadingState } from "@/components/ui/loading-state";

const currentYear = new Date().getFullYear();

export default function TrialBalanceTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const [periodNStart, setPeriodNStart] = useState(`${currentYear}-01-01`);
  const [periodNEnd, setPeriodNEnd] = useState(`${currentYear}-12-31`);

  const { data: balance, isLoading } = useTrialBalance(companyId, {
    periodNStart,
    periodNEnd,
  });

  const totalDebit = (balance ?? []).reduce((s, b) => s + b.debitN, 0);
  const totalCredit = (balance ?? []).reduce((s, b) => s + b.creditN, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1.5">
          <Label>Début de période</Label>
          <input
            type="date"
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={periodNStart}
            onChange={(e) => setPeriodNStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Fin de période</Label>
          <input
            type="date"
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={periodNEnd}
            onChange={(e) => setPeriodNEnd(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() =>
            window.open(
              `${apiClient.defaults.baseURL}/companies/${companyId}/accounting/trial-balance/export.csv?periodNStart=${periodNStart}&periodNEnd=${periodNEnd}`,
              "_blank",
            )
          }
        >
          <Download className="h-4 w-4" /> Exporter en CSV
        </Button>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState />}
        {balance && balance.length === 0 && (
          <EmptyState
            icon={BookOpen}
            message="Aucune écriture sur cette période."
          />
        )}
        {balance && balance.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balance.map((b) => (
                  <TableRow key={b.accountNumber}>
                    <TableCell className="font-mono text-xs">
                      {b.accountNumber}
                    </TableCell>
                    <TableCell>{b.label}</TableCell>
                    <TableCell className="tabular text-right">
                      {b.debitN > 0 ? formatAmount(b.debitN) : ""}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {b.creditN > 0 ? formatAmount(b.creditN) : ""}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="tabular text-right">
                    {formatAmount(totalDebit)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatAmount(totalCredit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

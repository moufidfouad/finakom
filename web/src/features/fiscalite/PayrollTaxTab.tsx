import { useState } from "react";
import { Save } from "lucide-react";
import { usePayrollTaxYear, useUpsertPayrollTaxMonth } from "./fiscalite.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useFormatAmount } from "@/hooks/useFormatAmount";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

/** Une seule donnée saisie par mois — la masse salariale brute — sert de
 * base à la fois au calcul CNPS et au calcul IR (voir payrollTaxEngine côté
 * backend : c'est délibérément une seule masse salariale partagée, pas deux
 * saisies séparées comme le faisait le tableur d'origine). */
export default function PayrollTaxTab({
  companyId,
  fiscalYear,
}: {
  companyId: string;
  fiscalYear: number;
}) {
  const formatAmount = useFormatAmount();
  const { data: months, isLoading } = usePayrollTaxYear(companyId, fiscalYear);
  const upsertMonth = useUpsertPayrollTaxMonth(companyId, fiscalYear);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  if (isLoading || !months) return <LoadingState />;
  const safeMonths = months;

  function save(monthIndex: number) {
    upsertMonth.mutate({
      period: new Date(Date.UTC(fiscalYear, monthIndex, 1)).toISOString(),
      grossPayroll: Number(drafts[monthIndex]) || 0,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CNPS & IR sur salaires — {fiscalYear}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>Masse salariale brute</TableHead>
              <TableHead className="text-right">Patronal</TableHead>
              <TableHead className="text-right">Salarial</TableHead>
              <TableHead className="text-right">FAC 1%</TableHead>
              <TableHead className="text-right">IR mensuel</TableHead>
              <TableHead className="text-right">Total à verser</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeMonths.map((month) => {
              const draft =
                drafts[month.month] ?? String(month.grossPayroll || "");
              const dirty = drafts[month.month] !== undefined;
              return (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">
                    {MONTH_LABELS[month.month]}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={draft}
                      className="w-32"
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [month.month]: e.target.value,
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {formatAmount(month.employerContribution)}
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {formatAmount(month.employeeContribution)}
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {formatAmount(month.vocationalTraining)}
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {formatAmount(month.monthlyIncomeTax)}
                  </TableCell>
                  <TableCell className="text-right tabular font-medium">
                    {formatAmount(month.totalToPay + month.monthlyIncomeTax)}
                  </TableCell>
                  <TableCell>
                    {dirty && (
                      <Button
                        size="icon"
                        variant="ghost"
                        isLoading={upsertMonth.isPending}
                        onClick={() => save(month.month)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

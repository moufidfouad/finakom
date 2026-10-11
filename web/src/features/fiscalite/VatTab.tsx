import { useState } from "react";
import { Save } from "lucide-react";
import { useUpsertVatMonth, useVatYear } from "./fiscalite.api";
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

/** Saisie du CA TTC et des achats TTC par mois — le reste (CA HT, TVA
 * collectée/déductible/nette, crédit reporté) est calculé côté serveur et
 * jamais éditable directement, cohérent avec le principe du moteur : ces
 * valeurs dérivées ne sont jamais stockées comme des champs de formulaire. */
export default function VatTab({
  companyId,
  fiscalYear,
}: {
  companyId: string;
  fiscalYear: number;
}) {
  const formatAmount = useFormatAmount();
  const { data: months, isLoading } = useVatYear(companyId, fiscalYear);
  const upsertMonth = useUpsertVatMonth(companyId, fiscalYear);
  const [drafts, setDrafts] = useState<
    Record<number, { salesIncTax: string; purchasesIncTax: string }>
  >({});

  if (isLoading || !months) return <LoadingState />;
  const safeMonths = months;

  function draftFor(month: NonNullable<typeof months>[number]) {
    return (
      drafts[month.month] ?? {
        salesIncTax: String(month.salesIncTax || ""),
        purchasesIncTax: String(month.purchasesIncTax || ""),
      }
    );
  }

  function setDraft(
    monthIndex: number,
    field: "salesIncTax" | "purchasesIncTax",
    value: string,
  ) {
    setDrafts((d) => ({
      ...d,
      [monthIndex]: { ...draftFor(safeMonths[monthIndex]), [field]: value },
    }));
  }

  function save(monthIndex: number) {
    const draft = draftFor(safeMonths[monthIndex]);
    upsertMonth.mutate({
      period: new Date(Date.UTC(fiscalYear, monthIndex, 1)).toISOString(),
      salesIncTax: Number(draft.salesIncTax) || 0,
      purchasesIncTax: Number(draft.purchasesIncTax) || 0,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>TVA mensuelle — {fiscalYear}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>CA TTC</TableHead>
              <TableHead>Achats TTC</TableHead>
              <TableHead className="text-right">TVA collectée</TableHead>
              <TableHead className="text-right">TVA déductible</TableHead>
              <TableHead className="text-right">Crédit reporté</TableHead>
              <TableHead className="text-right">TVA à verser</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((month) => {
              const draft = draftFor(month);
              const dirty = drafts[month.month] !== undefined;
              return (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">
                    {MONTH_LABELS[month.month]}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={draft.salesIncTax}
                      className="w-32"
                      onChange={(e) =>
                        setDraft(month.month, "salesIncTax", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={draft.purchasesIncTax}
                      className="w-32"
                      onChange={(e) =>
                        setDraft(month.month, "purchasesIncTax", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {formatAmount(month.vatCollected)}
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {formatAmount(month.vatDeductible)}
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {month.creditCarriedForward > 0
                      ? formatAmount(month.creditCarriedForward)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular font-medium">
                    {formatAmount(month.vatToPay)}
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

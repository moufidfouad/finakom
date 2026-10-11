import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import {
  useIncomeBudgetComparison,
  useIncomeBudgetLines,
  useUpsertIncomeBudgetLine,
} from "./incomeBudget.api";
import { IncomeBudgetLineInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/stat-card";
import { LoadingState } from "@/components/ui/loading-state";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";
import { MONTH_LABELS } from "@/features/treasury/treasury.constants";

const currentYear = new Date().getFullYear();

const schema = Yup.object({
  month: Yup.number().min(1).max(12).required(),
  type: Yup.string().oneOf(["Produit", "Charge"]).required(),
  amount: Yup.number().min(0, "Doit être positif").required("Requis"),
});

interface LineFormProps {
  fiscalYear: number;
  onSubmit: (v: IncomeBudgetLineInput) => Promise<void>;
}

function BudgetLineForm({ fiscalYear, onSubmit }: LineFormProps) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={
        {
          fiscalYear,
          month: 1,
          type: "Produit",
          amount: 0,
        } as IncomeBudgetLineInput
      }
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setError("");
        try {
          await onSubmit(values);
          resetForm({ values: { ...values, amount: 0 } });
        } catch (e) {
          setError(getApiErrorMessage(e));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-wrap items-end gap-3" noValidate>
          <div className="w-32">
            <FormSelectField
              name="month"
              label="Mois"
              options={MONTH_LABELS.map((m, i) => ({
                value: String(i + 1),
                label: m,
              }))}
            />
          </div>
          <div className="w-36">
            <FormSelectField
              name="type"
              label="Type"
              options={[
                { value: "Produit", label: "Produit" },
                { value: "Charge", label: "Charge" },
              ]}
            />
          </div>
          <div className="w-40">
            <FormTextField name="amount" label="Montant" type="number" />
          </div>
          <Button type="submit" variant="accent" isLoading={isSubmitting}>
            <Plus className="h-4 w-4" /> Enregistrer
          </Button>
          {error && <p className="w-full text-sm text-destructive">{error}</p>}
        </Form>
      )}
    </Formik>
  );
}

export default function IncomeBudgetTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [formOpen, setFormOpen] = useState(false);
  const { data: comparison, isLoading } = useIncomeBudgetComparison(
    companyId,
    fiscalYear,
  );
  const { data: existingLines } = useIncomeBudgetLines(companyId, fiscalYear);
  const upsertLine = useUpsertIncomeBudgetLine(companyId);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          Budget saisi par mois — le réel est calculé automatiquement depuis les
          écritures déjà comptabilisées, jamais ressaisi.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Exercice</Label>
            <input
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <Button variant="accent" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Saisir le budget
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState variant="card" />}

        {comparison && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <StatCard
                    icon={TrendingUp}
                    label="Produits budgétés"
                    value={formatAmount(comparison.totalBudgetRevenue)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <StatCard
                    icon={TrendingUp}
                    label="Produits réalisés"
                    value={formatAmount(comparison.totalActualRevenue)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <StatCard
                    icon={TrendingDown}
                    label="Charges budgétées"
                    value={formatAmount(comparison.totalBudgetExpense)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <StatCard
                    icon={TrendingDown}
                    label="Charges réalisées"
                    value={formatAmount(comparison.totalActualExpense)}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Budget vs réel — {fiscalYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">
                        Produits (budget)
                      </TableHead>
                      <TableHead className="text-right">
                        Produits (réel)
                      </TableHead>
                      <TableHead className="text-right">
                        Charges (budget)
                      </TableHead>
                      <TableHead className="text-right">
                        Charges (réel)
                      </TableHead>
                      <TableHead className="text-right">
                        Résultat (budget)
                      </TableHead>
                      <TableHead className="text-right">
                        Résultat (réel)
                      </TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.monthlyComparison.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">
                          {MONTH_LABELS[m.month - 1]}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs">
                          {formatAmount(m.budgetRevenue)}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs">
                          {formatAmount(m.actualRevenue)}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs">
                          {formatAmount(m.budgetExpense)}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs">
                          {formatAmount(m.actualExpense)}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs">
                          {formatAmount(m.budgetResult)}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs font-medium">
                          {formatAmount(m.actualResult)}
                        </TableCell>
                        <TableCell
                          className={`tabular text-right text-xs font-medium ${m.resultVariance >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {m.resultVariance >= 0 ? "+" : ""}
                          {formatAmount(m.resultVariance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Saisir le budget — {fiscalYear}</DialogTitle>
          </DialogHeader>
          <BudgetLineForm
            fiscalYear={fiscalYear}
            onSubmit={async (values) => {
              await upsertLine.mutateAsync(values);
            }}
          />
          {existingLines && existingLines.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Déjà saisi
              </p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {existingLines.map((l) => (
                  <li key={l.id}>
                    {MONTH_LABELS[l.month - 1]} — {l.type} :{" "}
                    {formatAmount(Number(l.amount))}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  BalanceYearResult,
  BusinessPlanBalanceLine,
  BalanceLineInput,
} from "@/types";
import { balanceApi } from "./subResources.api";
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
} from "./businessPlan.constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";

function BalanceLineForm({
  horizonYears,
  onSubmit,
  onCancel,
}: {
  horizonYears: number;
  onSubmit: (v: BalanceLineInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const years = Array.from({ length: horizonYears }, (_, i) => i + 1);
  return (
    <Formik
      initialValues={
        { year: 1, side: "Actif", category: "", amount: 0 } as BalanceLineInput
      }
      validationSchema={Yup.object({
        category: Yup.string().min(2).required("Requis"),
        amount: Yup.number().min(0).required("Requis"),
      })}
      onSubmit={async (v, { setSubmitting }) => {
        setError("");
        try {
          await onSubmit(v);
        } catch (e) {
          setError(getApiErrorMessage(e));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="year"
              label="Année"
              options={years.map((y) => ({
                value: String(y),
                label: `Année ${y}`,
              }))}
            />
            <FormSelectField
              name="side"
              label="Côté du bilan"
              options={[
                { value: "Actif", label: "Actif" },
                { value: "Passif", label: "Passif" },
              ]}
            />
          </div>
          <SideAwareCategoryField
            side={values.side}
            onSideChange={() => setFieldValue("category", "")}
          />
          <FormTextField name="amount" label="Montant" type="number" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Ajouter
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function SideAwareCategoryField({
  side,
  onSideChange,
}: {
  side: string;
  onSideChange: () => void;
}) {
  useEffect(() => {
    onSideChange();
  }, [side]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <FormSelectField
      name="category"
      label="Catégorie"
      placeholder="Sélectionner"
      options={(side === "Actif" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES).map(
        (c) => ({ value: c, label: c }),
      )}
      key={side}
    />
  );
}

export default function BalanceTab({
  planId,
  horizonYears,
  canEdit,
  balanceByYear,
}: {
  planId: string;
  horizonYears: number;
  canEdit: boolean;
  balanceByYear: Record<string, BalanceYearResult>;
}) {
  const formatAmount = useFormatAmount();
  const { data: lines } = balanceApi.useList(planId);
  const createLine = balanceApi.useCreate(planId);
  const deleteLine = balanceApi.useDelete(planId);
  const [formOpen, setFormOpen] = useState(false);
  const [year, setYear] = useState(1);
  const [deletingLine, setDeletingLine] =
    useState<BusinessPlanBalanceLine | null>(null);

  const years = Array.from({ length: horizonYears }, (_, i) => i + 1);
  const result = balanceByYear[String(year)];
  const yearLines = (lines ?? []).filter(
    (l: BusinessPlanBalanceLine) => l.year === year,
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {years.map((y) => (
          <Button
            key={y}
            size="sm"
            variant={y === year ? "accent" : "outline"}
            onClick={() => setYear(y)}
          >
            Année {y}
          </Button>
        ))}
      </div>

      {result && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                BFR
              </p>
              <p className="tabular mt-1 text-lg font-medium">
                {formatAmount(result.bfr)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Trésorerie nette
              </p>
              <p className="tabular mt-1 text-lg font-medium">
                {formatAmount(result.tresorerieNette)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Taux d'endettement
              </p>
              <p className="tabular mt-1 text-lg font-medium">
                {result.tauxEndettement !== null
                  ? `${(result.tauxEndettement * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Autonomie financière
              </p>
              <p className="tabular mt-1 text-lg font-medium">
                {result.autonomieFinanciere !== null
                  ? `${(result.autonomieFinanciere * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {result && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3">
          <span className="text-sm">
            Total actif :{" "}
            <strong className="tabular">
              {formatAmount(result.totalActif)}
            </strong>{" "}
            — Total passif :{" "}
            <strong className="tabular">
              {formatAmount(result.totalPassif)}
            </strong>
          </span>
          <Badge variant={result.isEquilibre ? "success" : "destructive"}>
            {result.isEquilibre ? "✅ Équilibré" : "⚠️ Non équilibré"}
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Lignes du bilan — Année {year}
        </p>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-6 sm:grid-cols-2">
        {(["Actif", "Passif"] as const).map((side) => (
          <Card key={side}>
            <CardHeader>
              <CardTitle className="text-base">{side}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {yearLines
                    .filter((l) => l.side === side)
                    .map((l: BusinessPlanBalanceLine) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.category}</TableCell>
                        <TableCell className="tabular text-right">
                          {formatAmount(Number(l.amount))}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingLine(l)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ligne de bilan</DialogTitle>
          </DialogHeader>
          <BalanceLineForm
            horizonYears={horizonYears}
            onSubmit={async (v) => {
              await createLine.mutateAsync(v);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingLine}
        onOpenChange={(o) => !o && setDeletingLine(null)}
        title="Supprimer cette ligne de bilan ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deletingLine?.category}</strong>. Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteLine.isPending}
        onConfirm={async () => {
          if (deletingLine) {
            await deleteLine.mutateAsync(deletingLine.id);
            setDeletingLine(null);
          }
        }}
      />
    </div>
  );
}

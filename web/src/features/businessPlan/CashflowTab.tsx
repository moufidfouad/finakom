import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  BusinessPlanCashflowLine,
  CashflowLineInput,
  MonthlyBalance,
} from "@/types";
import { cashflowApi } from "./subResources.api";
import {
  CASHFLOW_CATEGORIES_INFLOW,
  CASHFLOW_CATEGORIES_OUTFLOW,
} from "./businessPlan.constants";
import { MONTH_LABELS } from "@/features/treasury/treasury.constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import MonthlyBalanceChart from "@/components/common/charts/MonthlyBalanceChart";

function CashflowLineForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: CashflowLineInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={
        {
          month: 1,
          type: "Encaissement",
          category: "",
          label: "",
          amount: 0,
        } as CashflowLineInput
      }
      validationSchema={Yup.object({
        category: Yup.string().min(2).required("Requis"),
        label: Yup.string().min(2).required("Requis"),
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
      {({ isSubmitting, values }) => {
        const categories =
          values.type === "Encaissement"
            ? CASHFLOW_CATEGORIES_INFLOW
            : CASHFLOW_CATEGORIES_OUTFLOW;
        return (
          <Form className="flex flex-col gap-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormSelectField
                name="type"
                label="Type"
                options={[
                  { value: "Encaissement", label: "Encaissement (+)" },
                  { value: "Décaissement", label: "Décaissement (-)" },
                ]}
              />
              <FormSelectField
                name="month"
                label="Mois"
                options={MONTH_LABELS.map((m, i) => ({
                  value: String(i + 1),
                  label: m,
                }))}
              />
            </div>
            <FormSelectField
              name="category"
              label="Catégorie"
              placeholder="Sélectionner"
              options={categories.map((c) => ({ value: c, label: c }))}
              key={values.type}
            />
            <FormTextField name="label" label="Libellé" />
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
        );
      }}
    </Formik>
  );
}

export default function CashflowTab({
  planId,
  canEdit,
  schedule,
}: {
  planId: string;
  canEdit: boolean;
  schedule: MonthlyBalance[];
}) {
  const formatAmount = useFormatAmount();
  const { data: lines } = cashflowApi.useList(planId);
  const createLine = cashflowApi.useCreate(planId);
  const deleteLine = cashflowApi.useDelete(planId);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingLine, setDeletingLine] =
    useState<BusinessPlanCashflowLine | null>(null);

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Évolution du solde cumulé — Année 1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBalanceChart schedule={schedule} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Solde de trésorerie cumulé — Année 1
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />{" "}
                {MONTH_LABELS.map((m) => (
                  <TableHead key={m} className="text-right">
                    {m}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Encaissements</TableCell>
                {schedule.map((m) => (
                  <TableCell
                    key={m.month}
                    className="tabular text-right text-xs text-success"
                  >
                    {formatAmount(m.inflow)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Décaissements</TableCell>
                {schedule.map((m) => (
                  <TableCell
                    key={m.month}
                    className="tabular text-right text-xs text-destructive"
                  >
                    {formatAmount(m.outflow)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Solde cumulé</TableCell>
                {schedule.map((m) => (
                  <TableCell
                    key={m.month}
                    className="tabular text-right text-xs font-semibold"
                  >
                    {formatAmount(m.closingBalance)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {lines ? `${lines.length} écriture(s)` : "Chargement…"}
        </p>
        {canEdit && (
          <Button variant="accent" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nouvelle écriture
          </Button>
        )}
      </div>

      <Card className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(lines ?? []).map((l: BusinessPlanCashflowLine) => (
              <TableRow key={l.id}>
                <TableCell>{MONTH_LABELS[l.month - 1]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {l.category}
                </TableCell>
                <TableCell>{l.label}</TableCell>
                <TableCell
                  className={`tabular text-right font-medium ${l.type === "Encaissement" ? "text-success" : "text-destructive"}`}
                >
                  {l.type === "Encaissement" ? "+" : "-"}
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
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle écriture de trésorerie</DialogTitle>
          </DialogHeader>
          <CashflowLineForm
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
        title="Supprimer cette écriture ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deletingLine?.label}</strong>. Irréversible.
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

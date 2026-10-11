import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  BusinessPlanPLLine,
  PLLineInput,
  PLSection,
  PLYearResult,
} from "@/types";
import { plLinesApi } from "./subResources.api";
import { PL_SECTIONS } from "./businessPlan.constants";
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
import { EmptyState } from "@/components/ui/empty-state";
import YearlyResultChart from "@/components/common/charts/YearlyResultChart";
import { getApiErrorMessage } from "@/lib/apiError";

function PLLineForm({
  horizonYears,
  onSubmit,
  onCancel,
}: {
  horizonYears: number;
  onSubmit: (v: PLLineInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const years = Array.from({ length: horizonYears }, (_, i) => i + 1);
  return (
    <Formik
      initialValues={
        {
          year: 1,
          section: "ChiffreAffaires",
          label: "",
          amount: 0,
        } as PLLineInput
      }
      validationSchema={Yup.object({
        label: Yup.string().min(2).required("Requis"),
        amount: Yup.number().required("Requis"),
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
      {({ isSubmitting }) => (
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
              name="section"
              label="Rubrique"
              options={PL_SECTIONS}
            />
          </div>
          <FormTextField
            name="label"
            label="Libellé"
            placeholder="Vente de produits, Loyer, Salaires employés…"
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

function ResultRow({
  label,
  value,
  bold,
  pct,
}: {
  label: string;
  value: number;
  bold?: boolean;
  pct?: number | null;
}) {
  const formatAmount = useFormatAmount();
  return (
    <div
      className={`flex items-center justify-between border-b border-border py-2 text-sm last:border-0 ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className="tabular">
        {formatAmount(value)}
        {pct !== undefined && pct !== null && (
          <span className="ml-2 text-xs">({(pct * 100).toFixed(1)}%)</span>
        )}
      </span>
    </div>
  );
}

export default function ProfitLossTab({
  planId,
  horizonYears,
  canEdit,
  plByYear,
}: {
  planId: string;
  horizonYears: number;
  canEdit: boolean;
  plByYear: Record<string, PLYearResult>;
}) {
  const formatAmount = useFormatAmount();
  const { data: lines } = plLinesApi.useList(planId);
  const createLine = plLinesApi.useCreate(planId);
  const deleteLine = plLinesApi.useDelete(planId);
  const [formOpen, setFormOpen] = useState(false);
  const [year, setYear] = useState(1);
  const [deletingLine, setDeletingLine] = useState<BusinessPlanPLLine | null>(
    null,
  );

  const years = Array.from({ length: horizonYears }, (_, i) => i + 1);
  const yearResult = plByYear[String(year)];
  const yearLines = (lines ?? []).filter(
    (l: BusinessPlanPLLine) => l.year === year,
  );
  const sectionLabel = (s: PLSection) =>
    PL_SECTIONS.find((p) => p.value === s)?.label ?? s;

  return (
    <div>
      {horizonYears > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Évolution du chiffre d'affaires et du résultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <YearlyResultChart byYear={plByYear} />
          </CardContent>
        </Card>
      )}

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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Lignes — Année {year}</CardTitle>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubrique</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  {canEdit && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearLines.map((l: BusinessPlanPLLine) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {sectionLabel(l.section)}
                    </TableCell>
                    <TableCell>{l.label}</TableCell>
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
                {yearLines.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canEdit ? 4 : 3}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune ligne pour cette année.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cascade de résultat</CardTitle>
          </CardHeader>
          <CardContent>
            {yearResult ? (
              <div>
                <ResultRow
                  label="Chiffre d'affaires"
                  value={yearResult.chiffreAffaires}
                  bold
                />
                <ResultRow
                  label="Charges variables"
                  value={-yearResult.chargesVariables}
                />
                <ResultRow
                  label="Marge brute"
                  value={yearResult.margeBrute}
                  bold
                  pct={yearResult.tauxMargeBrute}
                />
                <ResultRow
                  label="Charges fixes"
                  value={-yearResult.chargesFixes}
                />
                <ResultRow
                  label="Charges de personnel"
                  value={-yearResult.chargesPersonnel}
                />
                <ResultRow
                  label="Excédent brut d'exploitation"
                  value={yearResult.excedentBrutExploitation}
                  bold
                />
                <ResultRow
                  label="Impôts et taxes"
                  value={-yearResult.impotsTaxes}
                />
                <ResultRow
                  label="Charges financières"
                  value={-yearResult.chargesFinancieres}
                />
                <ResultRow
                  label="Résultat avant impôts"
                  value={yearResult.resultatAvantImpots}
                  bold
                />
                <ResultRow
                  label="Impôt sur les sociétés"
                  value={-yearResult.impotSocietes}
                />
                <ResultRow
                  label="Résultat net"
                  value={yearResult.resultatNet}
                  bold
                  pct={yearResult.margeNette}
                />
                {yearResult.seuilDeRentabilite !== null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Seuil de rentabilité :{" "}
                    <span className="tabular font-medium text-foreground">
                      {formatAmount(yearResult.seuilDeRentabilite)}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <EmptyState message="Aucune donnée." variant="compact" />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ligne</DialogTitle>
          </DialogHeader>
          <PLLineForm
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
        title="Supprimer cette ligne ?"
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

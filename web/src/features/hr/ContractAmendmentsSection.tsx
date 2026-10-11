import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { FileEdit, Plus } from "lucide-react";
import { AmendmentReason, CreateAmendmentInput } from "@/types";
import {
  useContractAmendments,
  useCreateAmendment,
} from "./contractAmendments.api";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import FormTextArea from "@/components/form/FormTextArea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AMENDMENT_REASONS } from "./hr.constants";
import { getApiErrorMessage } from "@/lib/apiError";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

const schema = Yup.object({
  effectiveDate: Yup.string().required("La date est requise"),
  reason: Yup.string().required("Le motif est requis"),
  newPosition: Yup.string().optional(),
  newDepartment: Yup.string().optional(),
  newGrossSalary: Yup.number().positive("Doit être positif").optional(),
  newContractType: Yup.string().optional(),
  notes: Yup.string().optional(),
}).test(
  "at-least-one-change",
  "Au moins un champ (poste, département, salaire ou type de contrat) doit être modifié.",
  (values) =>
    !!(
      values.newPosition ||
      values.newDepartment ||
      values.newGrossSalary ||
      values.newContractType
    ),
);

const initialValues: CreateAmendmentInput = {
  effectiveDate: new Date().toISOString().slice(0, 10),
  reason: "Promotion" as AmendmentReason,
  newPosition: "",
  newDepartment: "",
  newGrossSalary: undefined,
  newContractType: "",
  notes: "",
};

function changesSummary(
  a: {
    previousPosition: string | null;
    newPosition: string | null;
    previousDepartment: string | null;
    newDepartment: string | null;
    previousGrossSalary: string | null;
    newGrossSalary: string | null;
    previousContractType: string | null;
    newContractType: string | null;
  },
  formatAmount: (v: number) => string,
) {
  const parts: string[] = [];
  if (a.newPosition)
    parts.push(`Poste : ${a.previousPosition} → ${a.newPosition}`);
  if (a.newDepartment)
    parts.push(`Département : ${a.previousDepartment} → ${a.newDepartment}`);
  if (a.newGrossSalary)
    parts.push(
      `Salaire : ${formatAmount(Number(a.previousGrossSalary))} → ${formatAmount(Number(a.newGrossSalary))}`,
    );
  if (a.newContractType)
    parts.push(`Contrat : ${a.previousContractType} → ${a.newContractType}`);
  return parts;
}

export default function ContractAmendmentsSection({
  employeeId,
}: {
  employeeId: string;
}) {
  const formatAmount = useFormatAmount();
  const { data: amendments } = useContractAmendments(employeeId);
  const createAmendment = useCreateAmendment(employeeId);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Avenants au contrat</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            "Fermer"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Nouvel avenant
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Chaque changement de poste, département, salaire ou type de contrat
          crée un avenant daté et conservé — la fiche employé est mise à jour
          automatiquement, l'historique n'est jamais perdu.
        </p>

        {showForm && (
          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={async (values, { resetForm, setSubmitting }) => {
              setFormError("");
              try {
                await createAmendment.mutateAsync({
                  effectiveDate: values.effectiveDate,
                  reason: values.reason,
                  newPosition: values.newPosition || undefined,
                  newDepartment: values.newDepartment || undefined,
                  newGrossSalary: values.newGrossSalary || undefined,
                  newContractType: values.newContractType || undefined,
                  notes: values.notes || undefined,
                });
                resetForm();
                setShowForm(false);
              } catch (err) {
                setFormError(
                  getApiErrorMessage(
                    err,
                    "Impossible d'enregistrer l'avenant.",
                  ),
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form
                className="mb-4 flex flex-col gap-3 border-b border-border pb-4"
                noValidate
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormTextField
                    name="effectiveDate"
                    label="Date d'effet"
                    type="date"
                  />
                  <FormSelectField
                    name="reason"
                    label="Motif"
                    options={AMENDMENT_REASONS.map((r) => ({
                      value: r,
                      label: r,
                    }))}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Renseignez uniquement ce qui change — les autres champs de la
                  fiche employé restent intacts.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormTextField
                    name="newPosition"
                    label="Nouveau poste (optionnel)"
                  />
                  <FormTextField
                    name="newDepartment"
                    label="Nouveau département (optionnel)"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormTextField
                    name="newGrossSalary"
                    label="Nouveau salaire brut (optionnel)"
                    type="number"
                  />
                  <FormTextField
                    name="newContractType"
                    label="Nouveau type de contrat (optionnel)"
                  />
                </div>
                <FormTextArea name="notes" label="Notes (optionnel)" rows={2} />
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
                <Button
                  type="submit"
                  size="sm"
                  variant="accent"
                  isLoading={isSubmitting}
                  className="self-start"
                >
                  Enregistrer l'avenant
                </Button>
              </Form>
            )}
          </Formik>
        )}

        {amendments && amendments.length === 0 && (
          <EmptyState
            message="Aucun avenant enregistré pour cet employé."
            variant="compact"
          />
        )}

        {amendments && amendments.length > 0 && (
          <ul className="flex flex-col gap-3">
            {amendments.map((a) => (
              <li key={a.id} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{a.reason}</span>
                  <span className="text-xs text-muted-foreground">
                    — effectif au {formatDate(a.effectiveDate)}
                  </span>
                </div>
                <ul className="mt-2 space-y-0.5 pl-6 text-sm text-muted-foreground">
                  {changesSummary(a, formatAmount).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                {a.notes && (
                  <p className="mt-1 pl-6 text-xs text-muted-foreground">
                    {a.notes}
                  </p>
                )}
                <p className="mt-1 pl-6 text-xs text-muted-foreground">
                  {a.createdBy
                    ? a.createdBy.fullName || a.createdBy.email
                    : "Utilisateur supprimé"}{" "}
                  · {formatDate(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

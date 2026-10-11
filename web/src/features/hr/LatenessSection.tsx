import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useCreateLateness,
  useDeleteLateness,
  useLateness,
} from "./employeeSubResources.api";
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LATENESS_STATUSES } from "./hr.constants";
import { LatenessInput } from "@/types";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

const schema = Yup.object({
  date: Yup.string().required(),
  scheduledTime: Yup.string()
    .matches(/^\d{2}:\d{2}$/, "HH:MM")
    .required(),
  arrivalTime: Yup.string()
    .matches(/^\d{2}:\d{2}$/, "HH:MM")
    .required(),
  lateMinutes: Yup.number().positive().required(),
  status: Yup.string().required(),
});
const initialValues: LatenessInput = {
  date: "",
  scheduledTime: "08:00",
  arrivalTime: "",
  lateMinutes: 0,
  reason: "",
  status: "Justifié",
};

export default function LatenessSection({
  employeeId,
}: {
  employeeId: string;
}) {
  const { data: records } = useLateness(employeeId);
  const createLateness = useCreateLateness(employeeId);
  const deleteLateness = useDeleteLateness(employeeId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Retards</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            "Fermer"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Ajouter
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={async (v, { resetForm, setSubmitting }) => {
              try {
                await createLateness.mutateAsync(v);
                resetForm();
                setShowForm(false);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form
                className="mb-4 grid gap-3 border-b border-border pb-4 sm:grid-cols-2"
                noValidate
              >
                <FormTextField name="date" label="Date" type="date" />
                <FormSelectField
                  name="status"
                  label="Statut"
                  options={LATENESS_STATUSES.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
                <FormTextField
                  name="scheduledTime"
                  label="Heure prévue"
                  placeholder="08:00"
                />
                <FormTextField
                  name="arrivalTime"
                  label="Heure d'arrivée"
                  placeholder="08:25"
                />
                <FormTextField
                  name="lateMinutes"
                  label="Retard (min)"
                  type="number"
                />
                <FormTextField name="reason" label="Motif" />
                <Button
                  type="submit"
                  size="sm"
                  variant="accent"
                  isLoading={isSubmitting}
                  className="sm:col-span-2 self-start"
                >
                  Enregistrer
                </Button>
              </Form>
            )}
          </Formik>
        )}
        {records && records.length === 0 && (
          <EmptyState message="Aucun retard enregistré." variant="compact" />
        )}
        {records && records.length > 0 && (
          <ul className="divide-y divide-border">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {formatDate(r.date)}
                </span>
                <span className="tabular">
                  {r.scheduledTime} → {r.arrivalTime}
                </span>
                <span className="tabular text-muted-foreground">
                  {r.lateMinutes} min
                </span>
                <span className="text-xs">{r.status}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteLateness.mutate(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useDeleteWorkedHours,
  useUpsertWorkedHours,
  useWorkedHours,
} from "./employeeSubResources.api";
import  FormTextField  from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkedHoursInput } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

const schema = Yup.object({
  periodDate: Yup.string().required(),
  contractualHours: Yup.number().positive().required(),
  actualHours: Yup.number().min(0).required(),
});
const initialValues: WorkedHoursInput = {
  periodDate: "",
  contractualHours: 173,
  actualHours: 173,
};

export default function WorkedHoursSection({
  employeeId,
}: {
  employeeId: string;
}) {
  const { data: records } = useWorkedHours(employeeId);
  const upsert = useUpsertWorkedHours(employeeId);
  const deleteRecord = useDeleteWorkedHours(employeeId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Heures travaillées</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            "Fermer"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Renseigner un mois
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
                await upsert.mutateAsync(v);
                resetForm();
                setShowForm(false);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form
                className="mb-4 grid gap-3 border-b border-border pb-4 sm:grid-cols-3"
                noValidate
              >
                <FormTextField
                  name="periodDate"
                  label="Mois (1er jour)"
                  type="date"
                />
                <FormTextField
                  name="contractualHours"
                  label="Heures contractuelles"
                  type="number"
                />
                <FormTextField
                  name="actualHours"
                  label="Heures réelles"
                  type="number"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="accent"
                  isLoading={isSubmitting}
                  className="sm:col-span-3 self-start"
                >
                  Enregistrer
                </Button>
              </Form>
            )}
          </Formik>
        )}
        {records && records.length === 0 && (
          <EmptyState message="Aucune heure renseignée." variant="compact" />
        )}
        {records && records.length > 0 && (
          <ul className="divide-y divide-border">
            {records.map((r) => {
              const overtime =
                Number(r.actualHours) - Number(r.contractualHours);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatDate(r.periodDate, {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="tabular">
                    {r.contractualHours}h → {r.actualHours}h
                  </span>
                  <span
                    className={`tabular ${overtime > 0 ? "text-success" : overtime < 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {overtime > 0 ? "+" : ""}
                    {overtime}h
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecord.mutate(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useAttendance,
  useCreateAttendance,
  useDeleteAttendance,
} from "./employeeSubResources.api";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENDANCE_STATUSES } from "./hr.constants";
import { AttendanceInput } from "@/types";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

const schema = Yup.object({
  date: Yup.string().required(),
  status: Yup.string().required(),
  daysPresent: Yup.number().min(0).required(),
  daysWorkable: Yup.number().positive().required(),
});
const initialValues: AttendanceInput = {
  date: "",
  status: "Présent",
  reason: "",
  daysPresent: 5,
  daysWorkable: 5,
};

export default function AttendanceSection({
  employeeId,
}: {
  employeeId: string;
}) {
  const { data: records } = useAttendance(employeeId);
  const createAttendance = useCreateAttendance(employeeId);
  const deleteAttendance = useDeleteAttendance(employeeId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Présences</CardTitle>
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
                await createAttendance.mutateAsync(v);
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
                  options={ATTENDANCE_STATUSES.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
                <FormTextField
                  name="daysPresent"
                  label="Jours présents"
                  type="number"
                />
                <FormTextField
                  name="daysWorkable"
                  label="Jours ouvrables"
                  type="number"
                />
                <FormTextField
                  name="reason"
                  label="Motif"
                  wrapperClassName="sm:col-span-2"
                />
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
          <EmptyState
            message="Aucune présence enregistrée."
            variant="compact"
          />
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
                <span>{r.status}</span>
                <span className="tabular text-muted-foreground">
                  {r.daysPresent}/{r.daysWorkable} j
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAttendance.mutate(r.id)}
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

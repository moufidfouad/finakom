import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useCreateLeaveRequest,
  useDeleteLeaveRequest,
  useLeaveRequests,
  useUpdateLeaveStatus,
} from "./employeeSubResources.api";
import { useLeaveBalance } from "./employees.api";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import FormTextArea from "@/components/form/FormTextArea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAVE_TYPES } from "./hr.constants";
import { LeaveInput, LeaveStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

const schema = Yup.object({
  leaveType: Yup.string().required(),
  startDate: Yup.string().required(),
  endDate: Yup.string().required(),
  numberOfDays: Yup.number().positive().required(),
});
const initialValues: LeaveInput = {
  leaveType: "Congé annuel",
  startDate: "",
  endDate: "",
  numberOfDays: 1,
  notes: "",
};

const statusVariant: Record<LeaveStatus, "success" | "accent" | "destructive"> =
  { Approuvé: "success", "En attente": "accent", Refusé: "destructive" };

export default function LeaveSection({ employeeId }: { employeeId: string }) {
  const { data: records } = useLeaveRequests(employeeId);
  const { data: balance } = useLeaveBalance(employeeId);
  const createLeave = useCreateLeaveRequest(employeeId);
  const updateStatus = useUpdateLeaveStatus(employeeId);
  const deleteLeave = useDeleteLeaveRequest(employeeId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Congés</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            "Fermer"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Demander
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {balance && (
          <div className="mb-4 grid grid-cols-3 gap-3 rounded-md border border-border bg-secondary/40 p-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Acquis</p>
              <p className="tabular text-lg font-medium">
                {balance.accruedDays}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pris</p>
              <p className="tabular text-lg font-medium">{balance.takenDays}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Solde</p>
              <p
                className={`tabular text-lg font-semibold ${balance.balanceDays < 0 ? "text-destructive" : "text-success"}`}
              >
                {balance.balanceDays}
              </p>
            </div>
          </div>
        )}
        {showForm && (
          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={async (v, { resetForm, setSubmitting }) => {
              try {
                await createLeave.mutateAsync(v);
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
                <FormSelectField
                  name="leaveType"
                  label="Type de congé"
                  options={LEAVE_TYPES.map((t) => ({ value: t, label: t }))}
                />
                <FormTextField
                  name="numberOfDays"
                  label="Nombre de jours"
                  type="number"
                />
                <FormTextField
                  name="startDate"
                  label="Date de début"
                  type="date"
                />
                <FormTextField name="endDate" label="Date de fin" type="date" />
                <FormTextArea
                  name="notes"
                  label="Notes"
                  rows={2}
                  wrapperClassName="sm:col-span-2"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="accent"
                  isLoading={isSubmitting}
                  className="sm:col-span-2 self-start"
                >
                  Soumettre
                </Button>
              </Form>
            )}
          </Formik>
        )}
        {records && records.length === 0 && (
          <EmptyState message="Aucune demande de congé." variant="compact" />
        )}
        {records && records.length > 0 && (
          <ul className="divide-y divide-border">
            {records.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.leaveType}</span>
                  <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {formatDate(r.startDate)} → {formatDate(r.endDate)} ·{" "}
                  <span className="tabular">{r.numberOfDays} j</span>
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  {r.status !== "Approuvé" && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          recordId: r.id,
                          status: "Approuvé",
                        })
                      }
                      className="text-success hover:underline"
                    >
                      Approuver
                    </button>
                  )}
                  {r.status !== "Refusé" && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          recordId: r.id,
                          status: "Refusé",
                        })
                      }
                      className="text-destructive hover:underline"
                    >
                      Refuser
                    </button>
                  )}
                  <button
                    onClick={() => deleteLeave.mutate(r.id)}
                    className="text-muted-foreground hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

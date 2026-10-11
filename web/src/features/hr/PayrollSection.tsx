import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import {
  useDeletePayroll,
  usePayroll,
  useUpsertPayroll,
} from "./employeeSubResources.api";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PayslipModal from "./PayslipModal";
import { PAYMENT_STATUSES_HR } from "./hr.constants";
import { PayrollInput } from "@/types";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

const schema = Yup.object({
  periodDate: Yup.string().required(),
  grossSalary: Yup.number().positive().required(),
  socialContribution: Yup.number().min(0).required(),
});
const initialValues: PayrollInput = {
  periodDate: "",
  grossSalary: 0,
  bonus: 0,
  latePenalty: 0,
  socialContribution: 0,
  paymentStatus: "En attente",
};

export default function PayrollSection({ employeeId }: { employeeId: string }) {
  const formatAmount = useFormatAmount();
  const { data: records } = usePayroll(employeeId);
  const upsert = useUpsertPayroll(employeeId);
  const deleteRecord = useDeletePayroll(employeeId);
  const [showForm, setShowForm] = useState(false);
  const [payslipPeriod, setPayslipPeriod] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Paie</CardTitle>
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
                  name="grossSalary"
                  label="Salaire brut"
                  type="number"
                />
                <FormTextField name="bonus" label="Prime" type="number" />
                <FormTextField
                  name="latePenalty"
                  label="Retenue retard"
                  type="number"
                />
                <FormTextField
                  name="socialContribution"
                  label="Cotisation sociale"
                  type="number"
                />
                <FormSelectField
                  name="paymentStatus"
                  label="Statut"
                  options={PAYMENT_STATUSES_HR.map((s) => ({
                    value: s,
                    label: s,
                  }))}
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
          <EmptyState message="Aucun bulletin renseigné." variant="compact" />
        )}
        {records && records.length > 0 && (
          <ul className="divide-y divide-border">
            {records.map((r) => {
              const net =
                Number(r.grossSalary) +
                Number(r.bonus) -
                Number(r.latePenalty) -
                Number(r.socialContribution);
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
                  <span className="tabular">{formatAmount(net)}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.paymentStatus}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPayslipPeriod(r.periodDate)}
                    >
                      <Receipt className="h-3.5 w-3.5 text-accent" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecord.mutate(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {payslipPeriod && (
        <PayslipModal
          employeeId={employeeId}
          period={payslipPeriod}
          onClose={() => setPayslipPeriod(null)}
        />
      )}
    </Card>
  );
}

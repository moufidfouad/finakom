import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { SupplierPaymentInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS } from "@/features/invoicing/invoicing.constants";

const paymentSchema = Yup.object({
  amount: Yup.number()
    .positive("Le montant doit être positif")
    .required("Requis"),
  date: Yup.string().required("La date est requise"),
  method: Yup.string().optional(),
});

const initialValues: SupplierPaymentInput = {
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  method: "Virement",
  note: "",
};

export default function SupplierPaymentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: SupplierPaymentInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={paymentSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setFormError("");
        try {
          await onSubmit(values);
          resetForm();
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer le règlement."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField name="amount" label="Montant" type="number" />
            <FormTextField name="date" label="Date" type="date" />
          </div>
          <FormSelectField
            name="method"
            label="Moyen de paiement"
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="accent"
              size="sm"
              isLoading={isSubmitting}
            >
              Enregistrer le règlement
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                Annuler
              </Button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}

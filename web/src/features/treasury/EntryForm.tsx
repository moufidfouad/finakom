import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { TreasuryEntryInput, TreasuryEntryType } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import {
  INFLOW_CATEGORIES,
  OUTFLOW_CATEGORIES,
  PAYMENT_METHODS,
  SUPPORTS,
} from "./treasury.constants";

const schema = Yup.object({
  date: Yup.string().required("Requis"),
  label: Yup.string().trim().min(2, "Requis").required("Requis"),
  category: Yup.string().required("Requis"),
  type: Yup.string().required("Requis"),
  amount: Yup.number()
    .positive("Le montant doit être positif")
    .required("Requis"),
  support: Yup.string().required("Requis"),
});

const defaultValues: TreasuryEntryInput = {
  date: "",
  label: "",
  category: "",
  type: "Encaissement",
  amount: 0,
  support: "Banque",
  paymentMethod: "",
  status: "Réalisé",
};

interface EntryFormProps {
  initialValues?: TreasuryEntryInput;
  onSubmit: (values: TreasuryEntryInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function EntryForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Enregistrer l'écriture",
  onCancel,
}: EntryFormProps) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer l'écriture."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values }) => {
        const categories =
          values.type === "Encaissement"
            ? INFLOW_CATEGORIES
            : OUTFLOW_CATEGORIES;
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
              <FormTextField name="date" label="Date" type="date" />
            </div>
            <FormTextField
              name="label"
              label="Libellé"
              placeholder="Règlement client X"
            />
            <FormSelectField
              name="category"
              label="Catégorie"
              placeholder="Sélectionner"
              options={categories.map((c) => ({ value: c, label: c }))}
              key={values.type as TreasuryEntryType}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormTextField name="amount" label="Montant" type="number" />
              <FormSelectField
                name="support"
                label="Support"
                options={SUPPORTS.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <FormSelectField
              name="paymentMethod"
              label="Mode de paiement (optionnel)"
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            />
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" variant="accent" isLoading={isSubmitting}>
                {submitLabel}
              </Button>
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

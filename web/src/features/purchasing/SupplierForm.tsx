import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { SupplierInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import {
  CLIENT_QUALITIES,
  CLIENT_TYPES,
} from "@/features/invoicing/invoicing.constants";

const supplierSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Le nom est requis")
    .required("Le nom est requis"),
  type: Yup.string().oneOf(CLIENT_TYPES).required(),
  address: Yup.string().optional(),
  phone: Yup.string().optional(),
  email: Yup.string().email("Email invalide").optional(),
  rccm: Yup.string().optional(),
  quality: Yup.string().oneOf(CLIENT_QUALITIES).required(),
});

const defaultValues: SupplierInput = {
  name: "",
  type: "Entreprise",
  address: "",
  phone: "",
  email: "",
  rccm: "",
  quality: "Nouveau",
};

interface SupplierFormProps {
  initialValues?: SupplierInput;
  onSubmit: (values: SupplierInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function SupplierForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Ajouter le fournisseur",
  onCancel,
}: SupplierFormProps) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={supplierSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer le fournisseur."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="name"
              label="Nom / Raison sociale"
              placeholder="Établissements Al-Amin"
            />
            <FormSelectField
              name="type"
              label="Type"
              options={CLIENT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <FormTextField name="address" label="Adresse (optionnel)" />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField name="phone" label="Téléphone (optionnel)" />
            <FormTextField
              name="email"
              label="Email (optionnel)"
              type="email"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField name="rccm" label="RCCM (optionnel)" />
            <FormSelectField
              name="quality"
              label="Fiabilité"
              options={CLIENT_QUALITIES.map((q) => ({ value: q, label: q }))}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
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
      )}
    </Formik>
  );
}

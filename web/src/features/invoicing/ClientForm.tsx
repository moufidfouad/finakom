import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { ClientInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { CLIENT_QUALITIES, CLIENT_TYPES } from "./invoicing.constants";

const clientSchema = Yup.object({
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
  creditLimit: Yup.number().positive("Doit être positif").optional(),
  defaultDiscountPercent: Yup.number()
    .min(0, "Doit être entre 0 et 100")
    .max(100, "Doit être entre 0 et 100")
    .optional(),
});

const defaultValues: ClientInput = {
  name: "",
  type: "Entreprise",
  address: "",
  phone: "",
  email: "",
  rccm: "",
  quality: "Nouveau",
  creditLimit: "",
  defaultDiscountPercent: "",
};

interface ClientFormProps {
  initialValues?: ClientInput;
  onSubmit: (values: ClientInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function ClientForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Ajouter le client",
  onCancel,
}: ClientFormProps) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={clientSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer le client."),
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
              placeholder="SARL Alpha Distribution"
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
              label="Qualité"
              options={CLIENT_QUALITIES.map((q) => ({ value: q, label: q }))}
            />
          </div>
          <FormTextField
            name="creditLimit"
            label="Encours maximum autorisé (optionnel)"
            type="number"
          />
          <FormTextField
            name="defaultDiscountPercent"
            label="Remise standard négociée en % (optionnel)"
            type="number"
          />
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

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { CreateMemberInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";

const schema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
  fullName: Yup.string().trim().optional(),
  password: Yup.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .optional(),
  role: Yup.string().oneOf(["ADMIN", "MEMBER"]).required(),
});

const initialValues: CreateMemberInput = {
  email: "",
  fullName: "",
  password: "",
  role: "MEMBER",
};

export default function MemberForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: CreateMemberInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setFormError("");
        try {
          await onSubmit({
            ...values,
            password: values.password || undefined,
            fullName: values.fullName || undefined,
          });
          resetForm();
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'ajouter ce membre."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="email"
            label="Email"
            type="email"
            placeholder="collegue@exemple.com"
          />
          <FormTextField name="fullName" label="Nom complet (optionnel)" />
          <FormTextField
            name="password"
            label="Mot de passe"
            type="password"
            hint="Requis uniquement si ce compte n'existe pas encore sur FINAKOM. Sinon, laissez vide : le compte existant sera simplement rattaché."
          />
          <FormSelectField
            name="role"
            label="Rôle dans l'entreprise"
            options={[
              {
                value: "MEMBER",
                label: "Membre — devis, factures, bons de livraison",
              },
              {
                value: "ADMIN",
                label: "Administrateur — accès complet à l'entreprise",
              },
            ]}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Ajouter le membre
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

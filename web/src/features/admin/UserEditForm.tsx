import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { AdminUser, UpdateUserInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";

const schema = Yup.object({
  fullName: Yup.string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .optional(),
  email: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
  role: Yup.string().oneOf(["USER", "ADMIN", "SUPERADMIN"]).required(),
});

export default function UserEditForm({
  user,
  onSubmit,
  onCancel,
}: {
  user: AdminUser;
  onSubmit: (values: UpdateUserInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={{
        fullName: user.fullName ?? "",
        email: user.email,
        role: user.role,
      }}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(
              err,
              "Impossible d'enregistrer les modifications.",
            ),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField name="fullName" label="Nom complet" />
          <FormTextField name="email" label="Email" type="email" />
          <FormSelectField
            name="role"
            label="Rôle plateforme"
            options={[
              { value: "USER", label: "Utilisateur" },
              { value: "ADMIN", label: "Admin (messagerie de contact)" },
              { value: "SUPERADMIN", label: "Super-administrateur" },
            ]}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Enregistrer
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

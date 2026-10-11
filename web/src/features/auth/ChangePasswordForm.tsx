import FormTextField from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";

function changePasswordSchema(hasLocalPassword: boolean) {
  return Yup.object({
    currentPassword: hasLocalPassword
      ? Yup.string().required("Votre mot de passe actuel est requis")
      : Yup.string().optional(),
    newPassword: Yup.string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .required("Requis"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Les mots de passe ne correspondent pas")
      .required("Veuillez confirmer le mot de passe"),
  });
}

export default function ChangePasswordForm({
  hasLocalPassword,
  onSuccess,
}: {
  hasLocalPassword: boolean;
  onSuccess?: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string>("");
  return (
    <Formik
      initialValues={{
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }}
      validationSchema={changePasswordSchema(hasLocalPassword)}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setFormError("");
        try {
          await apiClient.put("/auth/password", {
            currentPassword: hasLocalPassword
              ? values.currentPassword
              : undefined,
            newPassword: values.newPassword,
          });
          toast.success("Mot de passe mis à jour.");
          resetForm();
          await onSuccess?.();
        } catch (err) {
          setFormError(
            getApiErrorMessage(
              err,
              "Impossible de mettre à jour le mot de passe.",
            ),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          {hasLocalPassword && (
            <FormTextField
              name="currentPassword"
              label="Mot de passe actuel"
              type="password"
              autoComplete="current-password"
            />
          )}
          <FormTextField
            name="newPassword"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
          />
          <FormTextField
            name="confirmPassword"
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button
            type="submit"
            variant="accent"
            isLoading={isSubmitting}
            className="self-start"
          >
            {hasLocalPassword
              ? "Mettre à jour le mot de passe"
              : "Définir le mot de passe"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

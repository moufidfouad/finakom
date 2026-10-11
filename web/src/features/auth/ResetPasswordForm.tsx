import FormTextField from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiError";
import { apiClient } from "@/lib/axios";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";

const resetPasswordSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .required("Requis"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Les mots de passe ne correspondent pas")
    .required("Veuillez confirmer le mot de passe"),
});

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string>("");
  return (
    <Formik
      initialValues={{ newPassword: "", confirmPassword: "" }}
      validationSchema={resetPasswordSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await apiClient.post("/auth/reset-password", {
            token,
            newPassword: values.newPassword,
          });
          toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
          navigate("/connexion");
        } catch (err) {
          setFormError(getApiErrorMessage(err, "Lien invalide ou expiré."));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
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
            size="lg"
            variant="accent"
            isLoading={isSubmitting}
            className="mt-2"
          >
            Réinitialiser le mot de passe
          </Button>
        </Form>
      )}
    </Formik>
  );
}

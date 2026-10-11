import FormTextField from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiError";
import { candidateApiClient } from "@/lib/candidateAxios";
import { Form, Formik } from "formik";
import { Dispatch, SetStateAction, useState } from "react";
import * as Yup from "yup";

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
});

export default function CandidateForgotPasswordForm({
  setSent,
}: {
  setSent: Dispatch<SetStateAction<boolean>>;
}) {
  const [formError, setFormError] = useState<string>("");
  return (
    <Formik
      initialValues={{ email: "" }}
      validationSchema={forgotPasswordSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await candidateApiClient.post(
            "/candidate-auth/forgot-password",
            values,
          );
          setSent(true);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible de traiter la demande."),
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
            autoComplete="email"
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button
            type="submit"
            size="lg"
            variant="accent"
            isLoading={isSubmitting}
            className="mt-2"
          >
            Envoyer le lien de réinitialisation
          </Button>
        </Form>
      )}
    </Formik>
  );
}

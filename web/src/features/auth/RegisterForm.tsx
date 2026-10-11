import FormTextField from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext/context";
import { getApiErrorMessage } from "@/lib/apiError";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";

const registerSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  email: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
  password: Yup.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .required("Le mot de passe est requis"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Les mots de passe ne correspondent pas")
    .required("Veuillez confirmer le mot de passe"),
});

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string>("");
  return (
    <Formik
      initialValues={{
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      }}
      validationSchema={registerSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await register(
            values.email,
            values.password,
            values.fullName || undefined,
          );
          toast.success(
            "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.",
          );
          navigate("/app/entreprises");
        } catch (err) {
          setFormError(getApiErrorMessage(err, "Inscription impossible."));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="fullName"
            label="Nom complet (optionnel)"
            autoComplete="name"
          />
          <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <FormTextField
            name="password"
            label="Mot de passe"
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
            Créer mon compte
          </Button>
        </Form>
      )}
    </Formik>
  );
}

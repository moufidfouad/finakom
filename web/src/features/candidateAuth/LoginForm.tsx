import FormTextField from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/apiError";
import { candidateApiClient } from "@/lib/candidateAxios";
import { Form, Formik } from "formik";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";

const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
  password: Yup.string().required("Le mot de passe est requis"),
});

export default function CandidateLoginForm() {
  const { login } = useCandidateAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formError, setFormError] = useState<string>("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState<boolean>(false);

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await candidateApiClient.post("/candidate-auth/request-verification", {
        email: unverifiedEmail,
      });
      toast.success(
        "Si ce compte existe, un nouveau lien de vérification vient de lui être envoyé.",
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de renvoyer l'email."));
    } finally {
      setResending(false);
    }
  }

  return (
    <Formik
      initialValues={{
        email: "nastaha.houmadi@example.km",
        password: "Password123!",
      }}
      validationSchema={loginSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        setUnverifiedEmail(null);
        try {
          await login(values.email, values.password);
          const redirectTo =
            location.state?.redirect &&
            typeof location.state.redirect === "string"
              ? location.state.redirect
              : "/candidat/tableau-de-bord";
          navigate(redirectTo);
        } catch (err) {
          setFormError(getApiErrorMessage(err, "Connexion impossible."));
          if (getApiErrorCode(err) === "EMAIL_NOT_VERIFIED") {
            setUnverifiedEmail(values.email);
          }
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
          <div>
            <FormTextField
              name="password"
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
            />
            <Link
              to="/candidat/mot-de-passe-oublie"
              className="mt-1.5 inline-block text-xs text-muted-foreground hover:text-accent hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {formError && !unverifiedEmail && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          {unverifiedEmail && (
            <div className="flex flex-col items-start gap-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-3">
              <div className="flex items-start gap-2">
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-foreground">{formError}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                isLoading={resending}
                onClick={resendVerification}
              >
                Renvoyer l'email de vérification
              </Button>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            variant="accent"
            isLoading={isSubmitting}
            className="mt-2"
          >
            Se connecter
          </Button>
        </Form>
      )}
    </Formik>
  );
}

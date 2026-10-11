import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { candidateApiClient } from "@/lib/candidateAxios";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { usePageMeta } from "@/hooks/usePageMeta";
import AuthLayout from "@/components/layout/AuthLayout";

type Status = "loading" | "success" | "error";

export default function CandidateVerifyEmailPage() {
  usePageMeta({
    title: "Vérification de votre email — Espace candidat FINAKOM",
    description:
      "Confirmation de votre adresse email pour votre compte candidat FINAKOM.",
    path: "/candidat/verifier-email",
  });
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { refreshProfile } = useCandidateAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Ce lien de vérification est incomplet ou invalide.");
      return;
    }
    candidateApiClient
      .post("/candidate-auth/verify-email", { token })
      .then(async () => {
        setStatus("success");
        await refreshProfile();
      })
      .catch((err) => {
        setStatus("error");
        setError(getApiErrorMessage(err, "Lien invalide ou expiré."));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthLayout
      variant="candidate"
      title="Vérification de votre email"
      subtitle=""
      footer={
        <>
          Retour à{" "}
          <Link
            to="/candidat/tableau-de-bord"
            className="font-medium text-accent hover:underline"
          >
            votre espace candidat
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-secondary/40 p-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Vérification en cours…
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm text-foreground">
              Votre adresse email est confirmée. Merci !
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-foreground">{error}</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}


import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import AuthLayout from "@/components/layout/AuthLayout";
import CandidateResetPasswordForm from "@/features/candidateAuth/ResetPasswordForm";


export default function CandidateResetPasswordPage() {
  usePageMeta({
    title: "Réinitialiser le mot de passe — Espace candidat FINAKOM",
    description:
      "Choisissez un nouveau mot de passe pour votre compte candidat FINAKOM.",
    path: "/candidat/reinitialiser-mot-de-passe",
  });
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");


  if (!token) {
    return (
      <AuthLayout
        variant="candidate"
        title="Lien invalide"
        subtitle=""
        footer={
          <>
            Retour à la{" "}
            <Link
              to="/candidat/connexion"
              className="font-medium text-accent hover:underline"
            >
              connexion
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-secondary/40 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-foreground">
            Ce lien de réinitialisation est incomplet ou invalide.
          </p>
          <Link
            to="/candidat/mot-de-passe-oublie"
            className="text-sm font-medium text-accent hover:underline"
          >
            Faire une nouvelle demande
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      variant="candidate"
      title="Choisissez un nouveau mot de passe"
      subtitle="Ce lien est valable une heure."
      footer={
        <>
          Retour à la{" "}
          <Link
            to="/candidat/connexion"
            className="font-medium text-accent hover:underline"
          >
            connexion
          </Link>
        </>
      }
    >
      <CandidateResetPasswordForm token={token}/>
    </AuthLayout>
  );
}

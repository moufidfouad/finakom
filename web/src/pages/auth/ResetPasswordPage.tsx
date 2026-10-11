
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";
import ResetPasswordForm from "@/features/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <AuthLayout
        title="Lien invalide"
        subtitle=""
        footer={
          <>
            Retour à la{" "}
            <Link
              to="/connexion"
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
            to="/mot-de-passe-oublie"
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
      title="Choisissez un nouveau mot de passe"
      subtitle="Ce lien est valable une heure."
      footer={
        <>
          Retour à la{" "}
          <Link
            to="/connexion"
            className="font-medium text-accent hover:underline"
          >
            connexion
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}

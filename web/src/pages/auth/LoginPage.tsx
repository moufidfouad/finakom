import { useState } from "react";
import { Link } from "react-router-dom";
import GoogleSignInButton from "@/features/auth/GoogleSignInButton";
import { usePageMeta } from "@/hooks/usePageMeta";
import AuthLayout from "@/components/layout/AuthLayout";
import LoginForm from "@/features/auth/LoginForm";



export default function LoginPage() {
  usePageMeta({
    title: "Connexion — FINAKOM",
    description:
      "Connectez-vous à FINAKOM pour retrouver vos entreprises et piloter comptabilité, RH, facturation et trésorerie.",
    path: "/connexion",
  });

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  return (
    <AuthLayout
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver vos entreprises et vos modules."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link
            to="/inscription"
            className="font-medium text-accent hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <div className="mb-6 flex flex-col items-center gap-4">
        <GoogleSignInButton />
        <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou{" "}
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      <LoginForm
        unverifiedEmail={unverifiedEmail}
        setUnverifiedEmail={setUnverifiedEmail}
      />
    </AuthLayout>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";
import ForgotPasswordForm from "@/features/auth/ForgotPasswordForm";


export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Indiquez votre email : nous vous enverrons un lien pour en choisir un nouveau."
      footer={
        <>
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link
            to="/connexion"
            className="font-medium text-accent hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-secondary/40 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="text-sm text-foreground">
            Si un compte existe avec cet email, un lien de réinitialisation
            vient de lui être envoyé.
          </p>
          <p className="text-xs text-muted-foreground">
            Pensez à vérifier vos spams si vous ne le voyez pas d'ici quelques
            minutes.
          </p>
        </div>
      ) : (
        <ForgotPasswordForm setSent={setSent}/>
      )}
    </AuthLayout>
  );
}

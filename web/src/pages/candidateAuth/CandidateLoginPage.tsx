import { Link } from "react-router-dom";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import GoogleSignInButton from "@/features/auth/GoogleSignInButton";
import  AuthLayout  from "@/components/layout/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";
import CandidateLoginForm from "@/features/candidateAuth/LoginForm";

export default function CandidateLoginPage() {
  usePageMeta({
    title: "Connexion candidat — FINAKOM",
    description:
      "Connectez-vous à votre espace candidat FINAKOM pour gérer vos CV et suivre vos candidatures.",
    path: "/candidat/connexion",
  });
  const { loginWithGoogle } = useCandidateAuth();

  return (
    <AuthLayout
      variant="candidate"
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver vos CV et vos candidatures."
      footer={
        <>
          Pas encore de compte candidat ?{" "}
          <Link
            to="/candidat/inscription"
            className="font-medium text-accent hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <div className="mb-6 flex flex-col items-center gap-4">
        <GoogleSignInButton
          onSignIn={loginWithGoogle}
          redirectTo="/candidat/tableau-de-bord"
        />
        <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou{" "}
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      <CandidateLoginForm />
    </AuthLayout>
  );
}

import { Link } from "react-router-dom";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import GoogleSignInButton from "@/features/auth/GoogleSignInButton";
import AuthLayout from "@/components/layout/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";
import CandidateRegisterForm from "@/features/candidateAuth/RegisterForm";

export default function CandidateRegisterPage() {
  usePageMeta({
    title: "Créer un compte candidat — FINAKOM",
    description:
      "Créez votre compte candidat FINAKOM pour construire vos CV et postuler aux offres publiées par les entreprises.",
    path: "/candidat/inscription",
  });
  const { loginWithGoogle } = useCandidateAuth();

  return (
    <AuthLayout
      variant="candidate"
      title="Créez votre espace candidat"
      subtitle="Construisez vos CV et postulez aux offres publiées par les entreprises."
      footer={
        <>
          Déjà un compte candidat ?{" "}
          <Link
            to="/candidat/connexion"
            className="font-medium text-accent hover:underline"
          >
            Se connecter
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

      <CandidateRegisterForm />
    </AuthLayout>
  );
}

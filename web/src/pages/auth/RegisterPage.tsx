
import { Link } from 'react-router-dom';
import GoogleSignInButton from '@/features/auth/GoogleSignInButton';
import { usePageMeta } from '@/hooks/usePageMeta';
import RegisterForm from '@/features/auth/RegisterForm';
import AuthLayout from '@/components/layout/AuthLayout';


export default function RegisterPage() {
  usePageMeta({
    title: 'Créer un compte gratuit — FINAKOM',
    description: 'Créez votre compte FINAKOM et ajoutez votre première entreprise en quelques minutes — comptabilité SYSCOHADA, RH, facturation et trésorerie. Aucune carte bancaire requise.',
    path: '/inscription',
  });


  return (
    <AuthLayout
      title="Créez votre compte"
      subtitle="Ajoutez vos entreprises et lancez votre premier module en quelques minutes."
      footer={<>Déjà un compte ? <Link to="/connexion" className="font-medium text-accent hover:underline">Se connecter</Link></>}
    >
      <div className="mb-6 flex flex-col items-center gap-4">
        <GoogleSignInButton />
        <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      <RegisterForm/>
    </AuthLayout>
  );
}

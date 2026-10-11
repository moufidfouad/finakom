import { useState } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext/context";
import ChangePasswordForm from "@/features/auth/ChangePasswordForm";

export default function AccountPage() {
  const { user, refreshProfile } = useAuth();
  const [resending, setResending] = useState(false);

  if (!user) return null;

  const hasLocalPassword = user.authProvider !== "google";

  async function resendVerification() {
    setResending(true);
    try {
      await apiClient.post("/auth/resend-verification");
      toast.success(
        "Email de vérification renvoyé — vérifiez votre boîte mail.",
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de renvoyer l'email."));
    } finally {
      setResending(false);
    }
  }



  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Mon compte
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Informations personnelles et sécurité de votre compte.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nom</span>
            <span className="text-sm font-medium">{user.fullName || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="flex items-center gap-2 text-sm font-medium">
              {user.email}
              {user.emailVerified ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Vérifié
                </Badge>
              ) : (
                <Badge variant="accent" className="gap-1">
                  <ShieldAlert className="h-3 w-3" /> Non vérifié
                </Badge>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connexion</span>
            <span className="text-sm font-medium">
              {user.authProvider === "google"
                ? "Google"
                : "Email / mot de passe"}
            </span>
          </div>

          {!user.emailVerified && (
            <div className="mt-2 flex items-center justify-between rounded-md border border-accent/30 bg-accent/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-accent" />
                Confirmez votre adresse email pour sécuriser votre compte.
              </div>
              <Button
                size="sm"
                variant="outline"
                isLoading={resending}
                onClick={resendVerification}
              >
                Renvoyer l'email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">
            {hasLocalPassword
              ? "Changer mon mot de passe"
              : "Définir un mot de passe"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasLocalPassword && (
            <p className="mb-4 text-sm text-muted-foreground">
              Votre compte utilise la connexion Google. Vous pouvez également
              définir un mot de passe local pour vous connecter directement avec
              votre email.
            </p>
          )}
          <ChangePasswordForm
            hasLocalPassword={hasLocalPassword}
            onSuccess={refreshProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}



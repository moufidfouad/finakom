import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;
const SCRIPT_ID = "google-identity-services";

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Échec du chargement du script Google")),
      );
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Échec du chargement du script Google"));
    document.head.appendChild(script);
  });
}

interface GoogleSignInButtonProps {
  onSignIn: (idToken: string) => Promise<void>;
  redirectTo: string;
}

/**
 * Bouton "Se connecter avec Google" officiel (Google Identity Services). Le
 * jeton d'identité (ID token) est vérifié côté serveur avant toute création de
 * session — jamais fait confiance à des données décodées côté client.
 * N'affiche rien si VITE_GOOGLE_CLIENT_ID n'est pas configuré (dégradation
 * silencieuse plutôt que de casser la page de connexion/inscription).
 * `onSignIn`/`redirectTo` explicites plutôt qu'un contexte câblé en dur : ce
 * composant est partagé entre l'espace entreprise et l'espace candidat, deux
 * contextes d'authentification strictement séparés.
 */
export default function GoogleSignInButton({
  onSignIn,
  redirectTo,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              await onSignIn(response.credential);
              navigate(redirectTo);
            } catch (err) {
              setError(getApiErrorMessage(err, "Connexion Google impossible."));
              toast.error(
                getApiErrorMessage(err, "Connexion Google impossible."),
              );
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
          locale: "fr",
        });
      })
      .catch(() =>
        setError(
          "Impossible de charger le bouton Google — vérifiez votre connexion.",
        ),
      );

    return () => {
      cancelled = true;
    };
  }, [onSignIn, redirectTo, navigate]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

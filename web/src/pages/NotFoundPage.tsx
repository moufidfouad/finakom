import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-medium text-foreground">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="mt-6">
        <Button>Retour à l'accueil</Button>
      </Link>
    </div>
  );
}

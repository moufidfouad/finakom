import { Link } from "react-router-dom";
import { Briefcase, FileText } from "lucide-react";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { useCvs } from "@/features/cv/cv.api";
import { useCandidateApplications } from "@/features/jobApplications/jobApplications.api";
import { JobApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { usePageMeta } from "@/hooks/usePageMeta";

const STATUS_VARIANTS: Record<
  JobApplicationStatus,
  "secondary" | "success" | "destructive"
> = {
  Reçue: "secondary",
  "En cours": "secondary",
  Retenue: "success",
  Refusée: "destructive",
};

export default function CandidateDashboardPage() {
  usePageMeta({
    title: "Mon espace candidat — FINAKOM",
    description: "Votre espace candidat FINAKOM.",
    path: "/candidat/tableau-de-bord",
  });
  const { candidate, logout } = useCandidateAuth();
  const { data: cvs } = useCvs();
  const { data: applications, isLoading: applicationsLoading } =
    useCandidateApplications();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Bonjour {candidate?.fullName} 👋
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {candidate?.emailVerified
          ? "Votre espace candidat est prêt."
          : "Pensez à vérifier votre adresse email pour activer toutes les fonctionnalités."}
      </p>

      <div className="mt-8 rounded-md border border-border bg-secondary/30 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {cvs?.length
                ? `${cvs.length} CV enregistré(s)`
                : "Aucun CV pour le moment"}
            </p>
            <p className="text-xs text-muted-foreground">
              Créez ou modifiez vos CV pour pouvoir postuler aux offres.
            </p>
          </div>
        </div>
        <Link to="/candidat/cv">
          <Button variant="accent" className="mt-4 w-full sm:w-auto">
            Gérer mes CV
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Mes candidatures
        </h2>
        {applicationsLoading && <LoadingState variant="card" />}
        {applications && applications.length === 0 && (
          <p className="rounded-md border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
            Vous n'avez pas encore postulé à une offre — consultez les{" "}
            <Link to="/offres" className="text-accent hover:underline">
              offres publiées
            </Link>
            .
          </p>
        )}
        {applications && applications.length > 0 && (
          <div className="flex flex-col gap-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 rounded-md border border-border p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {app.jobPosting.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.jobPosting.company.name} ·{" "}
                    {new Date(app.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[app.status]}>
                  {app.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" className="mt-8" onClick={() => logout()}>
        Se déconnecter
      </Button>
    </div>
  );
}

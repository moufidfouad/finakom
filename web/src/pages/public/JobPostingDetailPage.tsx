import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, MapPin, MessageSquare } from "lucide-react";
import { usePublicJobPosting } from "@/features/jobPostings/publicJobPostings.api";
import { useCreateJobApplication } from "@/features/jobApplications/jobApplications.api";
import { useStartCandidateConversation } from "@/features/conversations/candidateConversations.api";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { useCvs } from "@/features/cv/cv.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function JobPostingDetailPage() {
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const { data: posting, isLoading } = usePublicJobPosting(jobPostingId);
  const { isAuthenticated } = useCandidateAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const startConversation = useStartCandidateConversation();
  const navigate = useNavigate();
  const location = useLocation();

  async function contactCompany() {
    if (!posting) return;
    try {
      const conversation = await startConversation.mutateAsync(
        posting.companyId,
      );
      navigate(`/candidat/messages?conversation=${conversation.id}`);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de démarrer la conversation."),
      );
    }
  }

  usePageMeta({
    title: posting
      ? `${posting.title} — ${posting.company.name} — FINAKOM`
      : "Offre d'emploi — FINAKOM",
    description: posting
      ? `${posting.title} chez ${posting.company.name} — candidature en ligne sur FINAKOM.`
      : "Détail d'une offre d'emploi FINAKOM.",
    path: `/offres/${jobPostingId}`,
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LoadingState />
      </div>
    );
  if (!posting)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Offre introuvable.
      </div>
    );

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-xs text-muted-foreground">
        <Link to="/offres" className="hover:text-foreground">
          ← Toutes les offres
        </Link>
      </p>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
            {posting.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posting.company.name}
          </p>
        </div>
        <Badge variant="secondary">{posting.contractType}</Badge>
      </div>
      {posting.location && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {posting.location}
        </p>
      )}

      <Card className="mt-8">
        <CardContent className="whitespace-pre-line p-6 text-sm leading-relaxed text-foreground">
          {posting.description}
        </CardContent>
      </Card>

      {(posting.desiredExperienceYears !== null ||
        posting.desiredSkills.length > 0) && (
        <div className="mt-6 flex flex-col gap-3">
          {posting.desiredExperienceYears !== null && (
            <p className="text-sm text-foreground">
              <span className="font-medium">Expérience souhaitée :</span>{" "}
              {posting.desiredExperienceYears} an(s) minimum
            </p>
          )}
          {posting.desiredSkills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground">
                Compétences souhaitées
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {posting.desiredSkills.map((s) => (
                  <Badge key={s.id} variant="secondary">
                    {s.title} · {s.level}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {isAuthenticated ? (
          <>
            <Button
              variant="accent"
              size="lg"
              onClick={() => setApplyOpen(true)}
            >
              Postuler à cette offre
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={contactCompany}
              isLoading={startConversation.isPending}
            >
              <MessageSquare className="h-4 w-4" /> Contacter l'entreprise
            </Button>
          </>
        ) : (
          <Link
            to="/candidat/connexion"
            state={{ redirect: location.pathname }}
          >
            <Button variant="accent" size="lg">
              Se connecter pour postuler
            </Button>
          </Link>
        )}
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postuler à "{posting.title}"</DialogTitle>
          </DialogHeader>
          <ApplyDialogContent
            jobPostingId={posting.id}
            onDone={() => setApplyOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ApplyDialogContent({
  jobPostingId,
  onDone,
}: {
  jobPostingId: string;
  onDone: () => void;
}) {
  const { data: cvs, isLoading } = useCvs();
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const createApplication = useCreateJobApplication(jobPostingId);

  if (isLoading) return <LoadingState variant="card" />;

  if (!cvs || cvs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-foreground">
          Vous devez d'abord créer un CV pour pouvoir postuler.
        </p>
        <Link to="/candidat/cv">
          <Button variant="accent">Créer un CV</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <p className="text-sm text-foreground">
          Votre candidature a bien été envoyée.
        </p>
        <Button variant="outline" onClick={onDone}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Choisissez le CV à soumettre pour cette candidature :
      </p>
      <div className="flex flex-col gap-2">
        {cvs.map((cv) => (
          <button
            key={cv.id}
            type="button"
            onClick={() => setSelectedCvId(cv.id)}
            className={`rounded-md border p-3 text-left text-sm transition-colors ${selectedCvId === cv.id ? "border-accent bg-accent/10" : "border-border hover:bg-secondary/40"}`}
          >
            {cv.title}
          </button>
        ))}
      </div>
      <Button
        variant="accent"
        disabled={!selectedCvId}
        isLoading={createApplication.isPending}
        onClick={async () => {
          if (!selectedCvId) return;
          try {
            await createApplication.mutateAsync(selectedCvId);
            setSubmitted(true);
          } catch (err) {
            toast.error(
              getApiErrorMessage(err, "Impossible d'envoyer la candidature."),
            );
          }
        }}
      >
        Envoyer ma candidature
      </Button>
    </div>
  );
}

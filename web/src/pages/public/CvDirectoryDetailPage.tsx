import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, UserRound } from "lucide-react";
import {
  usePublicCv,
  useContactCandidate,
  ContactCandidateInput,
} from "@/features/publicCandidates/publicCandidates.api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import  FormTextField  from "@/components/form/FormTextField";
import  FormTextArea  from "@/components/form/FormTextArea";
import { LoadingState } from "@/components/ui/loading-state";
import { getUploadUrl } from "@/lib/axios";
import { usePageMeta } from "@/hooks/usePageMeta";

const contactSchema = Yup.object({
  senderName: Yup.string()
    .trim()
    .min(2, "Le nom est requis")
    .required("Le nom est requis"),
  senderEmail: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
  message: Yup.string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .required("Le message est requis"),
  website: Yup.string().max(0),
});

const initialValues: ContactCandidateInput = {
  senderName: "",
  senderEmail: "",
  message: "",
  website: "",
};

export default function CvDirectoryDetailPage() {
  const { cvId } = useParams<{ cvId: string }>();
  const { data: cv, isLoading } = usePublicCv(cvId);
  const contactCandidate = useContactCandidate(cvId ?? "");

  usePageMeta({
    title: cv
      ? `${cv.title} — ${cv.candidate.fullName} — FINAKOM`
      : "Profil candidat — FINAKOM",
    description: cv
      ? `Profil de ${cv.candidate.fullName} sur FINAKOM.`
      : "Profil candidat FINAKOM.",
    path: `/annuaire-cv/${cvId}`,
    noindex: true,
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LoadingState />
      </div>
    );
  if (!cv)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Profil introuvable.
      </div>
    );

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-xs text-muted-foreground">
        <Link to="/annuaire-cv" className="hover:text-foreground">
          ← Tous les profils
        </Link>
      </p>
      <h1 className="mt-4 font-display text-2xl font-medium text-foreground sm:text-3xl">
        {cv.title}
      </h1>

      <div className="mt-2 flex items-center gap-3">
        {cv.candidate.photoUrl && (
          <img
            src={getUploadUrl(cv.candidate.photoUrl)}
            alt={cv.candidate.fullName}
            className="h-12 w-12 rounded-full object-cover"
          />
        )}
        {!cv.candidate.photoUrl && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
            <UserRound className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">{cv.candidate.fullName}</p>
      </div>

      {cv.summary && (
        <p className="mt-6 text-sm leading-relaxed text-foreground">
          {cv.summary}
        </p>
      )}
      {cv.skills.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-medium text-foreground">
            Compétences
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {cv.skills.map((s) => (
              <div key={s.id}>
                <Badge variant="secondary">
                  {s.title} · {s.level}
                </Badge>
                {s.specificities.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.specificities.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {cv.experiences.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-medium text-foreground">
            Expériences
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {cv.experiences.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">
                    {e.title} — {e.company}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.startDate).getFullYear()} –{" "}
                    {e.endDate
                      ? new Date(e.endDate).getFullYear()
                      : "aujourd'hui"}
                  </p>
                  {e.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {cv.educations.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-medium text-foreground">
            Formations
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {cv.educations.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">
                    {e.degree} — {e.school}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.startYear} – {e.endYear ?? "en cours"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(cv.languages.length > 0 ||
        cv.permits.length > 0 ||
        cv.interests.length > 0) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {cv.languages.length > 0 && (
            <div>
              <h2 className="font-display text-base font-medium text-foreground">
                Langues
              </h2>
              <div className="mt-2 flex flex-col gap-1">
                {cv.languages.map((l) => (
                  <p key={l.id} className="text-sm text-muted-foreground">
                    {l.name} — {l.level}
                  </p>
                ))}
              </div>
            </div>
          )}
          {cv.permits.length > 0 && (
            <div>
              <h2 className="font-display text-base font-medium text-foreground">
                Permis
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {cv.permits.join(", ")}
              </p>
            </div>
          )}
          {cv.interests.length > 0 && (
            <div>
              <h2 className="font-display text-base font-medium text-foreground">
                Centres d'intérêt
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {cv.interests.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg font-medium text-foreground">
          Contacter ce candidat
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre message sera transmis directement au candidat — son adresse
          email n'est jamais partagée.
        </p>

        <Card className="mt-4">
          <CardContent className="p-6">
            {contactCandidate.isSuccess ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm text-foreground">
                  Votre message a bien été envoyé.
                </p>
              </div>
            ) : (
              <Formik
                initialValues={initialValues}
                validationSchema={contactSchema}
                onSubmit={async (values, { setSubmitting, setStatus }) => {
                  try {
                    await contactCandidate.mutateAsync(values);
                  } catch (err) {
                    setStatus(
                      err instanceof Error
                        ? err.message
                        : "Impossible d'envoyer le message.",
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting, status }) => (
                  <Form className="flex flex-col gap-4" noValidate>
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="website">Ne pas remplir</label>
                      <input
                        type="text"
                        id="website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormTextField
                        name="senderName"
                        label="Votre nom"
                        autoComplete="name"
                      />
                      <FormTextField
                        name="senderEmail"
                        label="Votre email"
                        type="email"
                        autoComplete="email"
                      />
                    </div>
                    <FormTextArea name="message" label="Message" rows={5} />
                    {status && (
                      <p className="text-sm text-destructive">{status}</p>
                    )}
                    <Button
                      type="submit"
                      variant="accent"
                      isLoading={isSubmitting}
                      className="w-fit"
                    >
                      Envoyer le message
                    </Button>
                  </Form>
                )}
              </Formik>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  FileText,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import {
  useCreateCv,
  useCvs,
  useDeleteCv,
  useUpdateCv,
  useUpdateCvVisibility,
  getCvPdfUrl,
} from "@/features/cv/cv.api";
import CvForm from "@/features/cv/CvForm";
import CvSettingsDialog from "@/features/cv/CvSettingsDialog";
import CandidatePhotoCard from "@/features/candidateProfile/CandidatePhotoCard";
import { Cv, CvInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CandidateCvsPage() {
  usePageMeta({
    title: "Mes CV — Espace candidat FINAKOM",
    description:
      "Créez et gérez vos CV pour postuler aux offres publiées sur FINAKOM.",
    path: "/candidat/cv",
  });
  const { data: cvs, isLoading } = useCvs();
  const createCv = useCreateCv();
  const [editing, setEditing] = useState<Cv | "new" | null>(null);
  const [deleting, setDeleting] = useState<Cv | null>(null);
  const [settingsFor, setSettingsFor] = useState<Cv | null>(null);
  const updateVisibility = useUpdateCvVisibility();
  const deleteCv = useDeleteCv();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Mes CV
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez autant de CV que vous le souhaitez — un seul sera soumis par
            candidature.
          </p>
        </div>
        <Button variant="accent" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Nouveau CV
        </Button>
      </div>

      <CandidatePhotoCard />

      <div className="mt-8">
        {isLoading && <LoadingState />}

        {cvs && cvs.length === 0 && (
          <EmptyState
            icon={FileText}
            message="Aucun CV pour le moment — créez-en un pour pouvoir postuler."
          />
        )}

        {cvs && cvs.length > 0 && (
          <div className="flex flex-col gap-4">
            {cvs.map((cv) => (
              <Card key={cv.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-base">{cv.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cv.educations.length} formation(s) ·{" "}
                      {cv.experiences.length} expérience(s)
                    </p>
                  </div>
                  <Badge
                    variant={
                      cv.visibility === "Public" ? "success" : "secondary"
                    }
                  >
                    {cv.visibility}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(cv)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSettingsFor(cv)}
                  >
                    <Settings className="h-3.5 w-3.5" /> Réglages
                  </Button>
                  <a href={getCvPdfUrl(cv.id)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateVisibility.mutate(
                        {
                          cvId: cv.id,
                          visibility:
                            cv.visibility === "Public" ? "Brouillon" : "Public",
                        },
                        {
                          onError: (err) =>
                            toast.error(
                              getApiErrorMessage(err, "Action impossible."),
                            ),
                        },
                      )
                    }
                  >
                    {cv.visibility === "Public" ? "Dépublier" : "Publier"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(cv)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        <Link to="/candidat/tableau-de-bord" className="hover:text-foreground">
          ← Retour à mon espace
        </Link>
      </p>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Nouveau CV" : "Modifier le CV"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <CvFormWrapper
              cv={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
              createCv={createCv.mutateAsync}
            />
          )}
        </DialogContent>
      </Dialog>

      {settingsFor && (
        <CvSettingsDialog
          cv={settingsFor}
          open={!!settingsFor}
          onOpenChange={(o) => !o && setSettingsFor(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer ce CV ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.title}</strong>. Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteCv.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteCv.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}

/** Isole le hook useUpdateCv (qui a besoin d'un cvId fixe) du composant
 * parent, pour ne l'appeler qu'en mode édition sans casser les règles des hooks. */
function CvFormWrapper({
  cv,
  onDone,
  createCv,
}: {
  cv?: Cv;
  onDone: () => void;
  createCv: (input: CvInput) => Promise<Cv>;
}) {
  const updateCv = useUpdateCv(cv?.id ?? "");
  return (
    <CvForm
      initialCv={cv}
      onCancel={onDone}
      onSubmit={async (input) => {
        if (cv) await updateCv.mutateAsync(input);
        else await createCv(input);
        toast.success(cv ? "CV mis à jour." : "CV créé.");
        onDone();
      }}
    />
  );
}

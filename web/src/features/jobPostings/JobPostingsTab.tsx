import { useState } from "react";
import {
  Briefcase,
  Eye,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
import {
  useCreateJobPosting,
  useDeleteJobPosting,
  useJobPostings,
  useUpdateJobPosting,
  useUpdateJobPostingStatus,
} from "./jobPostings.api";
import JobPostingForm from "./JobPostingForm";
import JobApplicationsDialog from "./JobApplicationsDialog";
import { JobPosting, JobPostingInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

export default function JobPostingsTab({ companyId }: { companyId: string }) {
  const { canModify } = useCompanyPermissions(companyId);
  const { data: postings, isLoading } = useJobPostings(companyId);
  const createPosting = useCreateJobPosting(companyId);
  const updatePosting = useUpdateJobPosting(companyId);
  const updateStatus = useUpdateJobPostingStatus(companyId);
  const deletePosting = useDeleteJobPosting(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [deleting, setDeleting] = useState<JobPosting | null>(null);
  const [viewingApplications, setViewingApplications] =
    useState<JobPosting | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: JobPosting) {
    setEditing(p);
    setFormOpen(true);
  }

  const editValues: JobPostingInput | undefined = editing
    ? {
        title: editing.title,
        description: editing.description,
        location: editing.location ?? "",
        contractType: editing.contractType,
        desiredExperienceYears: editing.desiredExperienceYears ?? undefined,
        desiredSkills: editing.desiredSkills.map((s) => ({
          title: s.title,
          level: s.level,
        })),
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {postings ? `${postings.length} offre(s)` : "Chargement…"}
        </p>
        <Button variant="accent" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouvelle offre
        </Button>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {postings && postings.length === 0 && (
          <EmptyState
            icon={Briefcase}
            message="Aucune offre publiée pour cette entreprise."
          />
        )}

        {postings && postings.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Candidatures
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postings.map((p) => {
                  const editable = canModify(p.createdById);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {p.contractType}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p._count?.applications ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "Ouverte" ? "success" : "secondary"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingApplications(p)}
                          aria-label="Voir les candidatures"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {editable && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateStatus.mutate({
                                  id: p.id,
                                  status:
                                    p.status === "Ouverte"
                                      ? "Fermée"
                                      : "Ouverte",
                                })
                              }
                              aria-label={
                                p.status === "Ouverte" ? "Fermer" : "Rouvrir"
                              }
                            >
                              {p.status === "Ouverte" ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(p)}
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(p)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'offre" : "Nouvelle offre"}
            </DialogTitle>
          </DialogHeader>
          <JobPostingForm
            initialValues={editValues}
            submitLabel={editing ? "Enregistrer" : "Publier l'offre"}
            onSubmit={async (values) => {
              if (editing)
                await updatePosting.mutateAsync({
                  id: editing.id,
                  input: values,
                });
              else await createPosting.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingApplications}
        onOpenChange={(o) => !o && setViewingApplications(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Candidatures — {viewingApplications?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingApplications && (
            <JobApplicationsDialog
              companyId={companyId}
              jobPostingId={viewingApplications.id}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer cette offre ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.title}</strong>, ainsi que toutes les
            candidatures reçues. Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deletePosting.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deletePosting.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}

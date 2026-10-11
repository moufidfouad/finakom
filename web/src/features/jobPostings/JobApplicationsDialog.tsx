import { MessageSquare, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useApplicationsForJobPosting,
  useUpdateJobApplicationStatus,
} from "@/features/jobApplications/jobApplications.api";
import { useStartCompanyConversation } from "@/features/conversations/companyConversations.api";
import { JobApplicationStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";

const STATUS_OPTIONS: JobApplicationStatus[] = [
  "Reçue",
  "En cours",
  "Retenue",
  "Refusée",
];
const STATUS_VARIANT: Record<
  JobApplicationStatus,
  "secondary" | "accent" | "success" | "destructive"
> = {
  Reçue: "secondary",
  "En cours": "accent",
  Retenue: "success",
  Refusée: "destructive",
};

export default function JobApplicationsDialog({
  companyId,
  jobPostingId,
}: {
  companyId: string;
  jobPostingId: string;
}) {
  const { data: applications, isLoading } = useApplicationsForJobPosting(
    companyId,
    jobPostingId,
  );
  const updateStatus = useUpdateJobApplicationStatus(companyId, jobPostingId);
  const startConversation = useStartCompanyConversation(companyId);
  const navigate = useNavigate();

  async function contactCandidate(candidateId: string) {
    try {
      const conversation = await startConversation.mutateAsync({ candidateId });
      navigate(
        `/app/entreprises/${companyId}?tab=messages&conversation=${conversation.id}`,
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de démarrer la conversation."),
      );
    }
  }

  if (isLoading) return <LoadingState variant="card" />;

  if (!applications || applications.length === 0) {
    return (
      <EmptyState
        icon={Users}
        message="Aucune candidature reçue pour le moment."
      />
    );
  }

  return (
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
      {applications.map((app) => {
        const cv = app.cvSnapshot;
        return (
          <Card key={app.id}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {cv.title}
                  </p>
                  {cv.skills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {cv.skills.map((s) => (
                        <Badge
                          key={s.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {s.title} · {s.level}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant={STATUS_VARIANT[app.status]}>{app.status}</Badge>
              </div>

              {cv.experiences.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Expériences
                  </p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {cv.experiences.map((e) => (
                      <p key={e.id} className="text-xs text-muted-foreground">
                        {e.title} — {e.company}
                        <span className="text-muted-foreground/70">
                          {" "}
                          · {new Date(e.startDate).getFullYear()}–
                          {e.endDate
                            ? new Date(e.endDate).getFullYear()
                            : "aujourd'hui"}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {cv.educations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Formations
                  </p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {cv.educations.map((e) => (
                      <p key={e.id} className="text-xs text-muted-foreground">
                        {e.degree} — {e.school}
                        <span className="text-muted-foreground/70">
                          {" "}
                          · {e.startYear}–{e.endYear ?? "en cours"}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Select
                  value={app.status}
                  onValueChange={(v) =>
                    updateStatus.mutate({
                      id: app.id,
                      status: v as JobApplicationStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => contactCandidate(app.candidateId)}
                  isLoading={startConversation.isPending}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

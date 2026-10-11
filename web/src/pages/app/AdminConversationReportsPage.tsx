import { useState } from "react";
import { Flag } from "lucide-react";
import {
  useConversationReportDetail,
  useConversationReports,
  useResolveConversationReport,
} from "@/features/admin/adminConversationReports.api";
import { ConversationReport } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

function reporterLabel(r: ConversationReport): string {
  if (r.reporterType === "CANDIDATE")
    return r.reporterCandidate?.fullName ?? "Candidat";
  return r.reporterUser?.fullName || r.reporterUser?.email || "Entreprise";
}

function otherPartyLabel(r: ConversationReport): string {
  // L'autre partie est le participant qui n'est PAS le rapporteur — comparé
  // par présence de candidateId/companyId plutôt que par identité complète,
  // le rapporteur pouvant être soit un membre d'entreprise soit un candidat.
  const other = r.conversation.participants.find((p) =>
    r.reporterType === "CANDIDATE" ? !p.candidateId : !p.companyId,
  );
  return (
    other?.company?.name ?? other?.candidate?.fullName ?? "Partie inconnue"
  );
}

export default function AdminConversationReportsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"unresolved" | "resolved" | "all">(
    "unresolved",
  );
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data, isLoading } = useConversationReports(page, status);
  const { data: detail, isLoading: detailLoading } =
    useConversationReportDetail(selectedId);
  const resolveReport = useResolveConversationReport();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Signalements de conversation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} signalement(s)` : "Chargement…"}
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
            setSelectedId(undefined);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unresolved">Non résolus</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-2">
          {isLoading && <LoadingState />}
          {data && data.items.length === 0 && (
            <EmptyState
              icon={Flag}
              message="Aucun signalement pour le moment."
            />
          )}
          {data?.items.map((r) => (
            <Card
              key={r.id}
              className={`cursor-pointer transition-colors ${selectedId === r.id ? "border-primary" : ""}`}
              onClick={() => setSelectedId(r.id)}
            >
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {reporterLabel(r)}{" "}
                      <span className="text-muted-foreground">→</span>{" "}
                      {otherPartyLabel(r)}
                    </p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.reason}
                  </p>
                </div>
                <Badge
                  variant={r.resolvedAt ? "secondary" : "accent"}
                  className="shrink-0"
                >
                  {r.resolvedAt ? "Résolu" : "Non résolu"}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {data.page}/{data.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant →
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {!selectedId && (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un signalement pour l'examiner.
              </p>
            )}
            {selectedId && detailLoading && <LoadingState variant="card" />}
            {selectedId && detail && (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-medium">
                      Motif du signalement
                    </h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {detail.report.reason}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Signalé par {reporterLabel(detail.report)} le{" "}
                      {new Date(detail.report.createdAt).toLocaleString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                  {!detail.report.resolvedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={resolveReport.isPending}
                      onClick={() => resolveReport.mutate(detail.report.id)}
                    >
                      Marquer résolu
                    </Button>
                  )}
                </div>

                <h3 className="mt-6 font-display text-sm font-medium text-foreground">
                  Contenu de la conversation
                </h3>
                <div className="mt-2 flex max-h-[40vh] flex-col gap-2 overflow-y-auto rounded-md border border-border p-3">
                  {detail.messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucun message échangé.
                    </p>
                  )}
                  {detail.messages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-md bg-secondary/40 p-2 text-sm"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {m.senderType === "CANDIDATE"
                          ? (m.senderCandidate?.fullName ?? "Candidat")
                          : m.senderUser?.fullName ||
                            m.senderUser?.email ||
                            "Entreprise"}
                        {" · "}
                        {new Date(m.createdAt).toLocaleString("fr-FR")}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-foreground">
                        {m.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

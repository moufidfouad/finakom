import { useEffect, useRef, useState } from "react";
import { Flag, Send } from "lucide-react";
import { Message, MessageParticipantType } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/ui/loading-state";
import ReportConversationDialog from "./ReportConversationDialog";

interface ConversationThreadProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  currentType: MessageParticipantType;
  onSend: (body: string) => Promise<void>;
  isSending: boolean;
  onReport: (reason: string) => Promise<void>;
  isReporting: boolean;
  /** POC messagerie (voir évaluation stratégique) — indicateur visuel
   * uniquement, purement informatif : n'affecte jamais l'envoi/réception. */
  realtimeConnected?: boolean;
}

function senderLabel(m: Message): string {
  if (m.senderType === "CANDIDATE")
    return m.senderCandidate?.fullName ?? "Candidat";
  return m.senderUser?.fullName || m.senderUser?.email || "Entreprise";
}

/**
 * Générique — utilisée à la fois côté entreprise et côté candidat, avec
 * `currentType` pour savoir quels messages afficher à droite (les miens) vs
 * à gauche (l'autre partie). Le polling qui alimente `messages` vit dans le
 * hook appelant (useCompanyMessages/useCandidateMessages), pas ici.
 */
export  default function ConversationThread({
  messages,
  isLoading,
  currentType,
  onSend,
  isSending,
  onReport,
  isReporting,
  realtimeConnected,
}: ConversationThreadProps) {
  const [draft, setDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await onSend(body);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        {realtimeConnected !== undefined && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${realtimeConnected ? "bg-green-500" : "bg-muted-foreground/40"}`}
            />
            {realtimeConnected ? "Temps réel" : "Actualisation périodique"}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="text-xs text-muted-foreground"
        >
          <Flag className="h-3.5 w-3.5" /> Signaler
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <LoadingState variant="card" />}
        {messages && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun message pour le moment — écrivez le premier.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {messages?.map((m) => {
            const mine = m.senderType === currentType;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                {!mine && (
                  <span className="mb-0.5 text-xs text-muted-foreground">
                    {senderLabel(m)}
                  </span>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrivez votre message…"
          rows={2}
          className="resize-none"
        />
        <Button
          variant="accent"
          size="icon"
          onClick={handleSend}
          isLoading={isSending}
          disabled={!draft.trim()}
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <ReportConversationDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSubmit={onReport}
        isSubmitting={isReporting}
      />
    </div>
  );
}

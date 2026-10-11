import { MessageSquare } from "lucide-react";
import { ConversationListItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: ConversationListItem[] | undefined;
  isLoading: boolean;
  activeConversationId: string | undefined;
  onSelect: (conversationId: string) => void;
}

function otherName(c: ConversationListItem): string {
  return (
    c.otherParticipant?.company?.name ??
    c.otherParticipant?.candidate?.fullName ??
    "Conversation"
  );
}

/** Générique — réutilisée côté entreprise et côté candidat, l'"autre
 * participant" (déjà résolu côté service) suffit à afficher le bon nom sans
 * que ce composant ait besoin de connaître le type du lecteur courant. */
export default function ConversationList({
  conversations,
  isLoading,
  activeConversationId,
  onSelect,
}: ConversationListProps) {
  if (isLoading) return <LoadingState />;
  if (conversations && conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        message="Aucune conversation pour le moment."
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {conversations?.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={cn(
            "flex items-start justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-secondary/50",
            activeConversationId === c.id && "bg-secondary",
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm",
                c.unread
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground",
              )}
            >
              {otherName(c)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {c.lastMessage?.body ?? "Aucun message"}
            </p>
          </div>
          {c.unread && (
            <Badge variant="accent" className="mt-0.5 shrink-0">
              Nouveau
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

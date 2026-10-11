import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  msgKey,
  useCompanyConversations,
  useCompanyMessages,
  useMarkCompanyConversationRead,
  useReportCompanyConversation,
  useSendCompanyMessage,
} from "./companyConversations.api";
import { useConversationSocket } from "./useConversationSocket";
import  ConversationList  from "./ConversationList";
import  ConversationThread  from "./ConversationThread";

export default function MessagesTab({
  companyId,
  initialConversationId,
}: {
  companyId: string;
  initialConversationId?: string;
}) {
  const { data: conversations, isLoading } = useCompanyConversations(companyId);
  const [activeId, setActiveId] = useState<string | undefined>(
    initialConversationId,
  );
  const markRead = useMarkCompanyConversationRead(companyId);

  // Si la conversation initiale arrive via l'URL (ex: bouton "Contacter"
  // depuis une candidature), on la marque lue dès l'ouverture de l'onglet —
  // sans ça, le clic initial de sélection (qui déclenche normalement le
  // marquage) n'a jamais lieu puisque activeId est déjà pré-rempli.
  useEffect(() => {
    if (initialConversationId) markRead.mutate(initialConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  const { connected: socketConnected } = useConversationSocket(
    activeId,
    msgKey(companyId, activeId),
  );
  const { data: messages, isLoading: messagesLoading } = useCompanyMessages(
    companyId,
    activeId,
    !socketConnected,
  );
  const sendMessage = useSendCompanyMessage(companyId, activeId ?? "");
  const reportConversation = useReportCompanyConversation(
    companyId,
    activeId ?? "",
  );

  function selectConversation(id: string) {
    setActiveId(id);
    markRead.mutate(id);
  }

  return (
    <div className="grid overflow-hidden rounded-md border border-border sm:grid-cols-[280px_1fr]">
      <div className="max-h-[65vh] overflow-y-auto border-b border-border sm:border-b-0 sm:border-r">
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          activeConversationId={activeId}
          onSelect={selectConversation}
        />
      </div>
      <div className="h-[65vh]">
        {activeId ? (
          <ConversationThread
            messages={messages}
            isLoading={messagesLoading}
            currentType="COMPANY"
            onSend={(body) => sendMessage.mutateAsync(body).then(() => {})}
            isSending={sendMessage.isPending}
            onReport={(reason) =>
              reportConversation.mutateAsync(reason).then(() => {})
            }
            isReporting={reportConversation.isPending}
            realtimeConnected={socketConnected}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8" />
            Sélectionnez une conversation pour l'ouvrir.
          </div>
        )}
      </div>
    </div>
  );
}

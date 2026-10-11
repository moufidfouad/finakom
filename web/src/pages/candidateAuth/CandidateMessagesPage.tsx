import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  msgKey,
  useCandidateConversations,
  useCandidateMessages,
  useMarkCandidateConversationRead,
  useReportCandidateConversation,
  useSendCandidateMessage,
} from '@/features/conversations/candidateConversations.api';
import { useConversationSocket } from '@/features/conversations/useConversationSocket';
import  ConversationList  from '@/features/conversations/ConversationList';
import  ConversationThread  from '@/features/conversations/ConversationThread';
import { MessageSquare } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function CandidateMessagesPage() {
  usePageMeta({
    title: 'Mes messages — Espace candidat FINAKOM',
    description: 'Vos conversations avec les entreprises sur FINAKOM.',
    path: '/candidat/messages',
  });

  const [searchParams] = useSearchParams();
  const { data: conversations, isLoading } = useCandidateConversations();
  const [activeId, setActiveId] = useState<string | undefined>(searchParams.get('conversation') ?? undefined);
  const { connected: socketConnected } = useConversationSocket(activeId, msgKey(activeId));
  const { data: messages, isLoading: messagesLoading } = useCandidateMessages(activeId, !socketConnected);
  const sendMessage = useSendCandidateMessage(activeId ?? '');
  const markRead = useMarkCandidateConversationRead();
  const reportConversation = useReportCandidateConversation(activeId ?? '');

  // Symétrique à MessagesTab (espace entreprise) : si la conversation arrive
  // pré-sélectionnée via l'URL (bouton "Contacter l'entreprise" depuis une
  // offre), le clic de sélection qui déclencherait normalement le marquage
  // lu n'a jamais lieu — on le fait explicitement ici.
  useEffect(() => {
    const initial = searchParams.get('conversation');
    if (initial) markRead.mutate(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectConversation(id: string) {
    setActiveId(id);
    markRead.mutate(id);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-medium text-foreground">Mes messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vos échanges avec les entreprises.</p>

      <div className="mt-8 grid overflow-hidden rounded-md border border-border sm:grid-cols-[280px_1fr]">
        <div className="max-h-[70vh] overflow-y-auto border-b border-border sm:border-b-0 sm:border-r">
          <ConversationList conversations={conversations} isLoading={isLoading} activeConversationId={activeId} onSelect={selectConversation} />
        </div>
        <div className="h-[70vh]">
          {activeId ? (
            <ConversationThread
              messages={messages}
              isLoading={messagesLoading}
              currentType="CANDIDATE"
              onSend={(body) => sendMessage.mutateAsync(body).then(() => {})}
              isSending={sendMessage.isPending}
              onReport={(reason) => reportConversation.mutateAsync(reason).then(() => {})}
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
    </div>
  );
}

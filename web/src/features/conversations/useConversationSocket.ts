import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { Message } from '@/types';

/**
 * POC scopé à la messagerie (voir évaluation stratégique) — rejoint la room
 * de la conversation ouverte, met à jour le cache React Query directement à
 * la réception d'un message plutôt que de déclencher un nouveau fetch.
 * `connected` reste volontairement exposé : permet à l'appelant de couper le
 * polling rapide (3s) quand le canal temps réel fonctionne, et de s'y fier
 * comme filet de sécurité sinon — jamais les deux mécanismes actifs sans
 * qu'on puisse distinguer lequel a livré quoi.
 */
export function useConversationSocket(conversationId: string | undefined, messagesQueryKey: unknown[]) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    let joined = false;

    function handleNewMessage(message: Message) {
      if (message.conversationId !== conversationId) return;
      queryClient.setQueryData<Message[]>(messagesQueryKey, (old) => {
        if (!old) return [message];
        // Déduplique explicitement — le polling de secours pourrait avoir
        // déjà récupéré ce même message avant que l'événement socket
        // n'arrive, course possible entre les deux mécanismes.
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      });
    }

    function join() {
      socket.emit('join_conversation', conversationId, (ok: boolean) => {
        joined = ok;
        setConnected(ok);
      });
    }

    socket.on('connect', join);
    socket.on('new_message', handleNewMessage);
    socket.on('disconnect', () => setConnected(false));

    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('new_message', handleNewMessage);
      if (joined) socket.emit('leave_conversation', conversationId);
    };
  }, [conversationId, messagesQueryKey, queryClient]);

  return { connected };
}

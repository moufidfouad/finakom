import { prisma } from '@/config/prisma';
import { AppError } from '@/utils/AppError';
import { AuthenticatedUser } from '@/types/express';
import { getMemberCompanyOrThrow } from '@/modules/companies/companies.service';
import { getIO, isIOReady } from '@/realtime/io';
import { emitNewMessage } from '@/realtime/messagingSocket';
import { emitCandidateNotificationsChanged, emitCompanyNotificationsChanged } from '@/realtime/notificationsSocket';
import { ActingParticipant, TargetParticipant } from './conversations.types';

const PARTICIPANT_INCLUDE = {
  company: { select: { id: true, name: true, logoUrl: true } },
  candidate: { select: { id: true, fullName: true } },
} as const;

function whereForTarget(t: TargetParticipant) {
  return t.type === 'COMPANY' ? { companyId: t.companyId } : { candidateId: t.candidateId };
}

/** Vérifie qu'un participant AGISSANT fait réellement partie de la
 * conversation — jamais déduit de l'identité seule (candidateId/companyId
 * dans le jeton), toujours confirmé contre la table de jonction, pour ne
 * jamais laisser un tiers lire ou écrire dans une conversation qui ne le
 * concerne pas. */
async function assertParticipant(conversationId: string, actor: ActingParticipant) {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, ...whereForTarget(actor) },
  });
  if (!participant) throw AppError.forbidden("Vous n'êtes pas partie prenante de cette conversation.");
  return participant;
}

/**
 * Retrouve une conversation existante entre ces deux cibles, ou en crée une
 * — jamais deux conversations distinctes entre les deux mêmes parties.
 * Candidat↔candidat explicitement exclu (cadrage stratégique) ; une
 * conversation avec soi-même n'a pas de sens (entreprise↔elle-même).
 */
export async function findOrCreateConversation(a: TargetParticipant, b: TargetParticipant) {
  if (a.type === 'CANDIDATE' && b.type === 'CANDIDATE') {
    throw AppError.badRequest('Une conversation entre deux candidats n\'est pas prise en charge.');
  }
  const sameTarget = a.type === b.type && (a.type === 'COMPANY' ? a.companyId === (b as { companyId: string }).companyId : a.candidateId === (b as { candidateId: string }).candidateId);
  if (sameTarget) throw AppError.badRequest('Impossible de démarrer une conversation avec soi-même.');

  // Vérifie explicitement l'existence des DEUX cibles avant toute écriture —
  // sans ça, un identifiant invalide échouerait sur une contrainte de clé
  // étrangère PostgreSQL brute (erreur 500 opaque) plutôt qu'un message clair.
  await Promise.all(
    [a, b].map(async (t) => {
      if (t.type === 'COMPANY') {
        const exists = await prisma.company.findUnique({ where: { id: t.companyId }, select: { id: true } });
        if (!exists) throw AppError.notFound('Entreprise introuvable');
      } else {
        const exists = await prisma.candidate.findUnique({ where: { id: t.candidateId }, select: { id: true } });
        if (!exists) throw AppError.notFound('Candidat introuvable');
      }
    })
  );

  const existing = await prisma.conversation.findFirst({
    where: { AND: [{ participants: { some: whereForTarget(a) } }, { participants: { some: whereForTarget(b) } }] },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { participants: { create: [whereForTarget(a), whereForTarget(b)] } },
  });
}

export async function listConversations(actor: ActingParticipant) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: whereForTarget(actor) } },
    include: {
      participants: { include: PARTICIPANT_INCLUDE },
      messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // lastReadAt du participant COURANT (pas de l'autre côté) — calculé ici
  // plutôt que dans la requête, Prisma ne permet pas de filtrer une relation
  // incluse par "c'est le participant qui correspond à moi" en une seule requête lisible.
  return Promise.all(
    conversations.map(async (c: (typeof conversations)[number]) => {
      const me = c.participants.find((p: (typeof c.participants)[number]) =>
        actor.type === 'COMPANY' ? p.companyId === actor.companyId : p.candidateId === actor.candidateId
      );
      const lastMessage = c.messages[0];
      const unread = !!lastMessage && (!me?.lastReadAt || lastMessage.createdAt > me.lastReadAt);
      const otherParticipant = c.participants.find((p: (typeof c.participants)[number]) => p.id !== me?.id);
      return { id: c.id, updatedAt: c.updatedAt, lastMessage: lastMessage ?? null, unread, otherParticipant };
    })
  );
}

const MESSAGES_PAGE_SIZE = 30;

export async function listMessages(conversationId: string, actor: ActingParticipant, before?: string) {
  await assertParticipant(conversationId, actor);
  const messages = await prisma.message.findMany({
    where: { conversationId, ...(before && { createdAt: { lt: new Date(before) } }) },
    orderBy: { createdAt: 'desc' },
    take: MESSAGES_PAGE_SIZE,
    include: { senderUser: { select: { fullName: true, email: true } }, senderCandidate: { select: { fullName: true } } },
  });
  return messages.reverse(); // chronologique pour l'affichage, desc uniquement pour la pagination
}

export async function sendMessage(conversationId: string, sender: ActingParticipant, body: string) {
  await assertParticipant(conversationId, sender);
  if (!body.trim()) throw AppError.badRequest('Le message ne peut pas être vide.');

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderType: sender.type,
        senderUserId: sender.type === 'COMPANY' ? sender.userId : null,
        senderCandidateId: sender.type === 'CANDIDATE' ? sender.candidateId : null,
        body: body.trim(),
      },
      // Cohérent avec listMessages (REST) — le message émis en temps réel
      // doit avoir exactement la même forme que celui reçu au chargement
      // initial, sinon le fil afficherait un expéditeur vide pour les
      // messages arrivés par socket.
      include: { senderUser: { select: { fullName: true, email: true } }, senderCandidate: { select: { fullName: true } } },
    }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);

  // Fire-and-forget côté temps réel : jamais bloquant, jamais critique — la
  // base de données reste la seule source de vérité (le message existe déjà
  // avant cet appel), le polling de secours le récupérera de toute façon si
  // cet événement se perd pour une raison quelconque.
  if (isIOReady()) {
    const io = getIO();
    emitNewMessage(io, conversationId, message);

    // Notifie aussi l'AUTRE participant sur sa room personnelle — sans ça,
    // sa cloche de notification ne se mettrait à jour que si son fil de
    // conversation est déjà ouvert (ce que emitNewMessage seul couvrirait).
    // Un seul autre participant possible (jamais de groupe) — celui dont
    // l'identité ne correspond pas à l'expéditeur.
    const participants = await prisma.conversationParticipant.findMany({ where: { conversationId } });
    const other = participants.find((p: (typeof participants)[number]) =>
      sender.type === 'CANDIDATE' ? p.candidateId !== sender.candidateId : p.companyId !== sender.companyId
    );
    if (other?.candidateId) emitCandidateNotificationsChanged(io, other.candidateId);
    if (other?.companyId) emitCompanyNotificationsChanged(io, other.companyId);
  }

  return message;
}

export async function markConversationRead(conversationId: string, actor: ActingParticipant) {
  const participant = await assertParticipant(conversationId, actor);
  await prisma.conversationParticipant.update({ where: { id: participant.id }, data: { lastReadAt: new Date() } });
}

/** Condition de lancement non négociable du cadrage stratégique — jamais de
 * canal de message libre sans mécanisme minimal de signalement. */
export async function reportConversation(conversationId: string, reporter: ActingParticipant, reason: string) {
  await assertParticipant(conversationId, reporter);
  if (!reason.trim()) throw AppError.badRequest('Le motif du signalement est requis.');

  return prisma.conversationReport.create({
    data: {
      conversationId,
      reporterType: reporter.type,
      reporterUserId: reporter.type === 'COMPANY' ? reporter.userId : null,
      reporterCandidateId: reporter.type === 'CANDIDATE' ? reporter.candidateId : null,
      reason: reason.trim(),
    },
  });
}

/** Vérifie qu'un utilisateur est bien membre de l'entreprise avant de le
 * laisser agir en son nom — réutilisé par le contrôleur entreprise, cohérent
 * avec le patron déjà établi (getMemberCompanyOrThrow) plutôt qu'une
 * nouvelle vérification d'appartenance divergente. */
export async function assertCompanyMembership(companyId: string, auth: AuthenticatedUser) {
  await getMemberCompanyOrThrow(companyId, auth);
}

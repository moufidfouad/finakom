/**
 * Un participant "cible" identifie UN CÔTÉ d'une conversation, sans qui l'a
 * initiée précisément — utilisé pour trouver/créer une conversation.
 * Un participant "agissant" (Actor) identifie EN PLUS quel utilisateur précis
 * agit (nécessaire pour attribuer un message à un membre précis côté
 * entreprise) — utilisé pour envoyer un message, marquer lu, signaler.
 */
export type TargetParticipant =
  | { type: "COMPANY"; companyId: string }
  | { type: "CANDIDATE"; candidateId: string };

export type ActingParticipant =
  | { type: "COMPANY"; companyId: string; userId: string }
  | { type: "CANDIDATE"; candidateId: string };

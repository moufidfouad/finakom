import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Le message ne peut pas être vide").max(5000),
});

export const reportConversationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Merci de préciser le motif du signalement")
    .max(1000),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
});

/** Une entreprise peut démarrer une conversation avec un candidat OU une
 * autre entreprise — exactement un des deux champs, jamais les deux ni
 * aucun (cohérent avec la contrainte XOR déjà appliquée côté service pour
 * les participants). */
export const startConversationFromCompanySchema = z
  .object({
    candidateId: z.string().uuid().optional(),
    targetCompanyId: z.string().uuid().optional(),
  })
  .refine((v) => !!v.candidateId !== !!v.targetCompanyId, {
    message:
      "Précisez soit candidateId, soit targetCompanyId (jamais les deux).",
  });

export const startConversationFromCandidateSchema = z.object({
  companyId: z.string().uuid(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ReportConversationInput = z.infer<typeof reportConversationSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type StartConversationFromCompanyInput = z.infer<
  typeof startConversationFromCompanySchema
>;
export type StartConversationFromCandidateInput = z.infer<
  typeof startConversationFromCandidateSchema
>;

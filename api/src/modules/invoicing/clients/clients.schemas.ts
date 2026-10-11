import { z } from "zod";

// Le code client est généré automatiquement par le serveur (voir codeGenerator.ts) —
// il n'est jamais saisi par l'utilisateur, ni acceptable en entrée.
export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Le nom / la raison sociale est requis"),
  type: z.enum(["Entreprise", "Particulier"]),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  rccm: z.string().trim().optional(),
  quality: z.enum(["Nouveau", "Bon", "Excellent"]).default("Nouveau"),
  // Encours maximum autorisé — jamais bloquant, purement informatif (voir
  // creditLimitEngine.ts). z.literal('') accepté pour "aucune limite" (champ
  // vidé dans le formulaire), converti en `null` — jamais `undefined` — car
  // updateClient transmet l'input tel quel à Prisma (`data: input`) : `null`
  // efface explicitement le champ, `undefined` signifierait "ne pas y toucher"
  // et empêcherait de retirer une limite déjà configurée (même piège déjà
  // rencontré et corrigé pour Employee.managerId).
  creditLimit: z.coerce
    .number()
    .positive()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

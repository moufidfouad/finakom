import { z } from "zod";

// Le code employé est généré automatiquement par le serveur (voir codeGenerator.ts).
export const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(2, "Le nom complet est requis"),
  position: z.string().trim().min(2, "Le poste est requis"),
  department: z.string().trim().min(2, "Le département est requis"),
  employmentType: z.string().trim().min(2, "Le type de poste est requis"),
  grossSalary: z.coerce.number().positive("Le salaire brut doit être positif"),
  hireDate: z.coerce.date(),
  contractType: z.string().trim().min(2, "Le type de contrat est requis"),
  gender: z.enum(["M", "F"]),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  status: z
    .enum(["Actif", "Inactif", "Suspendu", "Démissionné"])
    .default("Actif"),
  // Champs dédiés à la génération du contrat de travail — optionnels, sans impact
  // sur la paie/présences. Remplis uniquement si un contrat doit être imprimé.
  workLocation: z.string().trim().optional(),
  weeklyHours: z.coerce.number().positive().optional(),
  trialPeriodMonths: z.coerce.number().int().nonnegative().optional(),
  contractEndDate: z.coerce.date().optional(),
  // Organigramme — supérieur hiérarchique direct. z.literal('') accepté pour
  // "aucun manager" (valeur vide d'un champ select HTML), converti en `null`
  // — jamais `undefined` — car updateEmployee transmet l'input tel quel à
  // Prisma (`data: input`) : `null` efface explicitement le champ, alors
  // qu'`undefined` signifierait "ne pas y toucher" et empêcherait de retirer un manager déjà assigné.
  managerId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

import { z } from "zod";

export const AMENDMENT_REASONS = [
  "Promotion",
  "Augmentation salariale",
  "Changement de poste",
  "Changement de département",
  "Autre",
] as const;

export const createAmendmentSchema = z
  .object({
    effectiveDate: z.coerce.date(),
    reason: z.enum(AMENDMENT_REASONS),
    newPosition: z.string().trim().min(2).optional(),
    newDepartment: z.string().trim().min(2).optional(),
    newGrossSalary: z.coerce.number().positive().optional(),
    newContractType: z.string().trim().min(2).optional(),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.newPosition ||
      data.newDepartment ||
      data.newGrossSalary !== undefined ||
      data.newContractType,
    {
      message:
        "Au moins un champ (poste, département, salaire ou type de contrat) doit être modifié par l'avenant.",
    },
  );

export type CreateAmendmentInput = z.infer<typeof createAmendmentSchema>;

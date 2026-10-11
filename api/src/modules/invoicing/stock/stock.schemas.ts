import { z } from "zod";

export const createMovementSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(["Entrée", "Sortie"]),
  quantity: z.coerce.number().positive("La quantité doit être positive"),
  reference: z.string().trim().optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;

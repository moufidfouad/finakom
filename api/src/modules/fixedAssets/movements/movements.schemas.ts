import { z } from "zod";

export const createAssetMovementSchema = z.object({
  date: z.coerce.date(),
  pieceNumber: z.string().trim().optional(),
  designation: z.string().trim().min(2, "La désignation est requise"),
  type: z.enum(["Acquisition", "Cession", "Mise en rebut"]),
  amount: z.coerce.number().nonnegative().default(0),
  disposalPrice: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
});

export type CreateAssetMovementInput = z.infer<
  typeof createAssetMovementSchema
>;

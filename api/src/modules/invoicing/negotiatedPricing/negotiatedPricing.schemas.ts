import { z } from "zod";

export const createNegotiatedPriceSchema = z.object({
  productId: z.string().uuid("Article invalide"),
  unitPriceHT: z.coerce
    .number()
    .nonnegative("Le prix ne peut pas être négatif"),
  notes: z.string().trim().optional(),
});

export type CreateNegotiatedPriceInput = z.infer<
  typeof createNegotiatedPriceSchema
>;

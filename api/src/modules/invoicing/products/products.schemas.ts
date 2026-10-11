import { z } from "zod";

// Le code article est généré automatiquement par le serveur (voir codeGenerator.ts).
export const createProductSchema = z.object({
  designation: z.string().trim().min(2, "La désignation est requise"),
  unit: z.string().trim().min(1, "L'unité est requise"),
  category: z.string().trim().min(2, "La catégorie est requise"),
  sellingPriceHT: z.coerce
    .number()
    .positive("Le prix de vente doit être positif"),
  unitCost: z.coerce.number().nonnegative().optional(),
  trackInventory: z.boolean().default(false),
  stockMin: z.coerce.number().nonnegative().default(0),
  stockInitial: z.coerce.number().nonnegative().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

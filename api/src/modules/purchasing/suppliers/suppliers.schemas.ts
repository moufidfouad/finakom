import { z } from "zod";

// Le code fournisseur est généré automatiquement par le serveur, comme pour les clients.
export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Le nom / la raison sociale est requis"),
  type: z.enum(["Entreprise", "Particulier"]),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  rccm: z.string().trim().optional(),
  quality: z.enum(["Nouveau", "Bon", "Excellent"]).default("Nouveau"),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

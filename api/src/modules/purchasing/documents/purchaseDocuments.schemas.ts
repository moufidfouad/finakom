import { z } from "zod";

export const PURCHASE_DOCUMENT_TYPES = [
  "Bon de commande",
  "Facture fournisseur",
] as const;

export const PURCHASE_STATUS_BY_TYPE: Record<
  (typeof PURCHASE_DOCUMENT_TYPES)[number],
  string[]
> = {
  "Bon de commande": ["Envoyé", "Confirmé", "Annulé"],
  // Le statut d'une Facture fournisseur est calculé à partir des paiements
  // enregistrés (voir supplierPayments.service) : jamais modifiable manuellement.
  "Facture fournisseur": ["Impayée", "Partielle", "Payée"],
};

const purchaseLineSchema = z
  .object({
    productId: z.string().uuid().optional(),
    designation: z.string().trim().optional(),
    quantity: z.coerce.number().positive("La quantité doit être positive"),
    unitPriceHT: z.coerce.number().nonnegative().optional(),
    observation: z.string().trim().optional(),
  })
  .refine(
    (line) =>
      line.productId || (line.designation && line.unitPriceHT !== undefined),
    {
      message:
        "Chaque ligne doit référencer un article du catalogue, ou fournir une désignation et un prix unitaire",
    },
  );

export const createPurchaseDocumentSchema = z.object({
  type: z.enum(PURCHASE_DOCUMENT_TYPES),
  supplierId: z.string().uuid("Fournisseur invalide"),
  date: z.coerce.date(),
  notes: z.string().trim().optional(),
  linkedOrderId: z.string().uuid().optional(),
  lines: z
    .array(purchaseLineSchema)
    .min(1, "Le document doit contenir au moins une ligne"),
});

export const updatePurchaseDocumentSchema = z.object({
  supplierId: z.string().uuid("Fournisseur invalide").optional(),
  date: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
  lines: z
    .array(purchaseLineSchema)
    .min(1, "Le document doit contenir au moins une ligne")
    .optional(),
});

export const updatePurchaseStatusSchema = z.object({
  status: z.string().min(2, "Le statut est requis"),
});

export type CreatePurchaseDocumentInput = z.infer<
  typeof createPurchaseDocumentSchema
>;
export type UpdatePurchaseDocumentInput = z.infer<
  typeof updatePurchaseDocumentSchema
>;

import { z } from "zod";

export const DOCUMENT_TYPES = [
  "Devis",
  "Facture",
  "Bon de livraison",
  "Avoir",
] as const;

export const STATUS_BY_TYPE: Record<(typeof DOCUMENT_TYPES)[number], string[]> =
  {
    Devis: ["Envoyé", "Accepté", "Refusé", "Expiré"],
    "Bon de livraison": ["En préparation", "Livré"],
    // Le statut d'une Facture est calculé à partir des paiements ET des avoirs
    // enregistrés (voir documents.service.ts::refreshInvoiceStatus) : il n'est
    // jamais modifiable manuellement via cet endpoint.
    Facture: ["Impayée", "Partielle", "Payée"],
    // Un avoir n'a pas de cycle de statut — il est émis, point final.
    Avoir: ["Émis"],
  };

const documentLineSchema = z
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

export const createDocumentSchema = z
  .object({
    type: z.enum(DOCUMENT_TYPES),
    clientId: z.string().uuid("Client invalide"),
    date: z.coerce.date(),
    notes: z.string().trim().optional(),
    linkedQuoteId: z.string().uuid().optional(),
    linkedInvoiceId: z.string().uuid().optional(),
    lines: z
      .array(documentLineSchema)
      .min(1, "Le document doit contenir au moins une ligne"),
  })
  .refine((data) => data.type !== "Avoir" || !!data.linkedInvoiceId, {
    message:
      "Un avoir doit obligatoirement être lié à la facture d'origine (linkedInvoiceId).",
    path: ["linkedInvoiceId"],
  });

export const updateDocumentSchema = z.object({
  clientId: z.string().uuid("Client invalide").optional(),
  date: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
  lines: z
    .array(documentLineSchema)
    .min(1, "Le document doit contenir au moins une ligne")
    .optional(),
});

export const updateStatusSchema = z.object({
  status: z.string().min(2, "Le statut est requis"),
});

export const deliverLineSchema = z.object({
  quantityDelivered: z.coerce.number().nonnegative(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

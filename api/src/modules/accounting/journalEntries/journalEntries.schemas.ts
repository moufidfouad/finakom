import { z } from "zod";

export const JOURNAL_TYPES = [
  "ACHATS",
  "VENTES",
  "BANQUE",
  "CAISSE",
  "OD",
  "PAIE",
] as const;

const entryLineSchema = z.object({
  accountNumber: z.string().trim().min(1, "Le compte est requis"),
  label: z.string().trim().optional(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
});

export const createManualEntrySchema = z.object({
  journal: z.enum(JOURNAL_TYPES),
  date: z.coerce.date(),
  label: z.string().trim().min(2, "Le libellé est requis"),
  lines: z
    .array(entryLineSchema)
    .min(
      2,
      "Une écriture comptable doit avoir au moins deux lignes (partie double)",
    ),
});

export const trialBalanceQuerySchema = z.object({
  periodNStart: z.coerce.date(),
  periodNEnd: z.coerce.date(),
  periodN1Start: z.coerce.date().optional(),
  periodN1End: z.coerce.date().optional(),
});

export type CreateManualEntryInput = z.infer<typeof createManualEntrySchema>;
export type TrialBalanceQuery = z.infer<typeof trialBalanceQuerySchema>;

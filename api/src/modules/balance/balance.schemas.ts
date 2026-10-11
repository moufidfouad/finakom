import { z } from "zod";

export const balanceLineSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .min(1, "Le n° de compte est requis")
    .regex(/^\d+$/, "Le n° de compte doit être numérique (ex: 401100)"),
  label: z.string().trim().optional().default(""),
  debitN: z.coerce.number().min(0).default(0),
  creditN: z.coerce.number().min(0).default(0),
  debitN1: z.coerce.number().min(0).default(0),
  creditN1: z.coerce.number().min(0).default(0),
});

export const replaceBalanceSchema = z.object({
  lines: z.array(balanceLineSchema).min(1, "La balance ne peut pas être vide"),
});

export type BalanceLineInput = z.infer<typeof balanceLineSchema>;
export type ReplaceBalanceInput = z.infer<typeof replaceBalanceSchema>;

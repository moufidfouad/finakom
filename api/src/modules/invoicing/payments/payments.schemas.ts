import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.coerce.date(),
  method: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

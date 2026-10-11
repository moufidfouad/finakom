import { z } from "zod";
export const upsertPayrollSchema = z.object({
  periodDate: z.coerce.date(),
  grossSalary: z.coerce.number().positive(),
  bonus: z.coerce.number().nonnegative().default(0),
  latePenalty: z.coerce.number().nonnegative().default(0),
  socialContribution: z.coerce.number().nonnegative(),
  paymentStatus: z.enum(["Payé", "En attente"]).default("En attente"),
  paymentDate: z.coerce.date().optional(),
});
export type UpsertPayrollInput = z.infer<typeof upsertPayrollSchema>;

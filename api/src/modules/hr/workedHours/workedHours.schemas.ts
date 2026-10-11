import { z } from "zod";
export const upsertWorkedHoursSchema = z.object({
  periodDate: z.coerce.date(),
  contractualHours: z.coerce.number().positive(),
  actualHours: z.coerce.number().nonnegative(),
});
export type UpsertWorkedHoursInput = z.infer<typeof upsertWorkedHoursSchema>;

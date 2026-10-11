import { z } from "zod";
export const createAttendanceSchema = z.object({
  date: z.coerce.date(),
  status: z.enum([
    "Présent",
    "Absence justifiée",
    "Absence injustifiée",
    "Congé",
    "Maladie",
  ]),
  reason: z.string().trim().optional(),
  daysPresent: z.coerce.number().int().nonnegative(),
  daysWorkable: z.coerce.number().int().positive(),
});
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;

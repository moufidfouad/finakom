import { z } from "zod";
export const createLatenessSchema = z.object({
  date: z.coerce.date(),
  scheduledTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Format attendu HH:MM"),
  arrivalTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Format attendu HH:MM"),
  lateMinutes: z.coerce.number().int().positive(),
  reason: z.string().trim().optional(),
  status: z.enum(["Justifié", "Non justifié", "Toléré"]),
});
export type CreateLatenessInput = z.infer<typeof createLatenessSchema>;

import { z } from "zod";
export const createLeaveSchema = z
  .object({
    leaveType: z.string().trim().min(2, "Le type de congé est requis"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    numberOfDays: z.coerce.number().int().positive(),
    status: z.enum(["Approuvé", "En attente", "Refusé"]).default("En attente"),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  });
export const updateLeaveStatusSchema = z.object({
  status: z.enum(["Approuvé", "En attente", "Refusé"]),
});
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;

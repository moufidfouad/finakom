import { z } from "zod";

export const createJobApplicationSchema = z.object({
  cvId: z.string().uuid("CV invalide"),
});

export const updateJobApplicationStatusSchema = z.object({
  status: z.enum(["Reçue", "En cours", "Retenue", "Refusée"]),
});

export type CreateJobApplicationInput = z.infer<
  typeof createJobApplicationSchema
>;
export type UpdateJobApplicationStatusInput = z.infer<
  typeof updateJobApplicationStatusSchema
>;

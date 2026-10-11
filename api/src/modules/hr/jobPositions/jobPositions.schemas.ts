import { z } from "zod";

export const createJobPositionSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Le code du poste est requis (ex: POST-001)"),
    title: z.string().trim().min(2, "L'intitulé du poste est requis"),
    department: z.string().trim().min(2, "Le département est requis"),
    category: z.enum(["Cadre", "Agent de maîtrise", "Employé"]),
    salaryMin: z.coerce.number().nonnegative(),
    salaryMax: z.coerce.number().positive(),
    mainTasks: z.string().trim().optional(),
  })
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message:
      "Le salaire maximum doit être supérieur ou égal au salaire minimum",
    path: ["salaryMax"],
  });

export const updateJobPositionSchema = z.object({
  code: z.string().trim().min(2).optional(),
  title: z.string().trim().min(2).optional(),
  department: z.string().trim().min(2).optional(),
  category: z.enum(["Cadre", "Agent de maîtrise", "Employé"]).optional(),
  salaryMin: z.coerce.number().nonnegative().optional(),
  salaryMax: z.coerce.number().positive().optional(),
  mainTasks: z.string().trim().optional(),
});

export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>;
export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>;

import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().email("Email invalide").optional(),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

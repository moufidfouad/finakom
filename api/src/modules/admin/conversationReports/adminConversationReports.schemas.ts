import { z } from "zod";

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["unresolved", "resolved", "all"]).default("unresolved"),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

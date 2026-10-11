import { z } from "zod";

export const fiscalYearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

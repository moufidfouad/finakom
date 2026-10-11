import { z } from "zod";

export const vatSummaryQuerySchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export type VatSummaryQuery = z.infer<typeof vatSummaryQuerySchema>;

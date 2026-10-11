import { z } from "zod";

export const createAnalysisSchema = z.object({
  label: z.string().min(2, "Le libellé est requis"),
  exerciceNDate: z.coerce.date(),
  exerciceN1Date: z.coerce.date().optional(),
  analystName: z.string().optional(),
});

export const updateAnalysisSchema = createAnalysisSchema.partial().extend({
  status: z.enum(["draft", "completed"]).optional(),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type UpdateAnalysisInput = z.infer<typeof updateAnalysisSchema>;

import { z } from "zod";

/** Tous optionnels — une entreprise ne modifie généralement qu'un ou deux
 * taux à la fois (ex: mise à jour annuelle suite à une loi de finances),
 * jamais tout le barème d'un coup. */
export const upsertTaxSettingsSchema = z.object({
  vatStandardRate: z.coerce.number().min(0).max(1).optional(),
  vatExportRate: z.coerce.number().min(0).max(1).optional(),
  corporateTaxRate: z.coerce.number().min(0).max(1).optional(),
  corporateTaxMinRate: z.coerce.number().min(0).max(1).optional(),
  corporateTaxInstallmentRate: z.coerce.number().min(0).max(1).optional(),
  businessLicenseRate: z.coerce.number().min(0).max(1).optional(),
  socialContribEmployerRate: z.coerce.number().min(0).max(1).optional(),
  socialContribEmployeeRate: z.coerce.number().min(0).max(1).optional(),
  vocationalTrainingRate: z.coerce.number().min(0).max(1).optional(),
  withholdingTaxRate: z.coerce.number().min(0).max(1).optional(),
  incomeTaxAllowanceRate: z.coerce.number().min(0).max(1).optional(),
  incomeTaxBracket1Threshold: z.coerce.number().nonnegative().optional(),
  incomeTaxBracket1Rate: z.coerce.number().min(0).max(1).optional(),
  incomeTaxBracket2Threshold: z.coerce.number().nonnegative().optional(),
  incomeTaxBracket2Rate: z.coerce.number().min(0).max(1).optional(),
  incomeTaxBracket3Threshold: z.coerce.number().nonnegative().optional(),
  incomeTaxBracket3Rate: z.coerce.number().min(0).max(1).optional(),
  incomeTaxBracket4Rate: z.coerce.number().min(0).max(1).optional(),
  corporateTaxMinThreshold: z.coerce.number().nonnegative().optional(),
  vatMandatoryThreshold: z.coerce.number().nonnegative().optional(),
});

export type UpsertTaxSettingsInput = z.infer<typeof upsertTaxSettingsSchema>;

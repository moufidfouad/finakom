import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  listPayrollTaxQuerySchema,
  upsertMonthlyPayrollTaxSchema,
} from "./payrollTax.schemas";
import * as payrollTaxService from "./payrollTax.service";

export const upsertMonthlyPayrollTaxHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertMonthlyPayrollTaxSchema.parse(req.body);
    res.json(
      await payrollTaxService.upsertMonthlyPayrollTax(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const getPayrollTaxYearSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { year } = listPayrollTaxQuerySchema.parse(req.query);
    res.json(
      await payrollTaxService.getPayrollTaxYearSummary(
        req.params.companyId,
        requireAuthContext(req),
        year,
      ),
    );
  },
);

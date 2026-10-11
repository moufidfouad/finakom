import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  fiscalYearQuerySchema,
  upsertCorporateTaxReturnSchema,
} from "./corporateTax.schemas";
import * as corporateTaxService from "./corporateTax.service";

export const upsertCorporateTaxReturnHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertCorporateTaxReturnSchema.parse(req.body);
    res.json(
      await corporateTaxService.upsertCorporateTaxReturn(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const getCorporateTaxSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { fiscalYear } = fiscalYearQuerySchema.parse(req.query);
    res.json(
      await corporateTaxService.getCorporateTaxSummary(
        req.params.companyId,
        requireAuthContext(req),
        fiscalYear,
      ),
    );
  },
);

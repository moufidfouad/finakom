import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  fiscalYearQuerySchema,
  upsertBusinessLicenseReturnSchema,
} from "./businessLicense.schemas";
import * as businessLicenseService from "./businessLicense.service";

export const upsertBusinessLicenseReturnHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertBusinessLicenseReturnSchema.parse(req.body);
    res.json(
      await businessLicenseService.upsertBusinessLicenseReturn(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const getBusinessLicenseSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { fiscalYear, monthsLate } = fiscalYearQuerySchema.parse(req.query);
    res.json(
      await businessLicenseService.getBusinessLicenseSummary(
        req.params.companyId,
        requireAuthContext(req),
        fiscalYear,
        monthsLate,
      ),
    );
  },
);

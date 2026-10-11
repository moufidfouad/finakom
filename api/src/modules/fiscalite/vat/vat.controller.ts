import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  listVatReturnsQuerySchema,
  upsertMonthlyVatReturnSchema,
} from "./vat.schemas";
import * as vatService from "./vat.service";

export const upsertMonthlyVatReturnHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertMonthlyVatReturnSchema.parse(req.body);
    res.json(
      await vatService.upsertMonthlyVatReturn(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const getVatYearSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { year } = listVatReturnsQuerySchema.parse(req.query);
    res.json(
      await vatService.getVatYearSummary(
        req.params.companyId,
        requireAuthContext(req),
        year,
      ),
    );
  },
);

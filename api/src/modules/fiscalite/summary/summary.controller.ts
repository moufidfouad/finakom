import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { fiscalYearQuerySchema } from "./summary.schemas";
import * as summaryService from "./summary.service";

export const getFiscalCalendarHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { year } = fiscalYearQuerySchema.parse(req.query);
    res.json(
      await summaryService.getFiscalCalendar(
        req.params.companyId,
        requireAuthContext(req),
        year,
      ),
    );
  },
);

export const getFiscalRecapHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { year } = fiscalYearQuerySchema.parse(req.query);
    res.json(
      await summaryService.getFiscalRecap(
        req.params.companyId,
        requireAuthContext(req),
        year,
      ),
    );
  },
);

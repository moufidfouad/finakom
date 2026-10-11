import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { closeFiscalYear, listFiscalYears } from "./fiscalYearClosing.service";

const closeSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
});

export const listFiscalYearsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await listFiscalYears(req.params.companyId, requireAuthContext(req)),
    );
  },
);

export const closeFiscalYearHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { fiscalYear } = closeSchema.parse(req.body);
    res
      .status(201)
      .json(
        await closeFiscalYear(
          req.params.companyId,
          fiscalYear,
          requireAuthContext(req),
        ),
      );
  },
);

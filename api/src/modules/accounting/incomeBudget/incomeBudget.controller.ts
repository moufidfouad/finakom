import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import { upsertIncomeBudgetLineSchema } from "./incomeBudget.schemas";
import * as incomeBudgetService from "./incomeBudget.service";

function parseFiscalYear(req: Request): number {
  const fiscalYear = Number(req.query.fiscalYear);
  if (!fiscalYear)
    throw AppError.badRequest("Le paramètre ?fiscalYear=AAAA est requis");
  return fiscalYear;
}

export const listIncomeBudgetLinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await incomeBudgetService.listIncomeBudgetLines(
        req.params.companyId,
        requireAuthContext(req),
        parseFiscalYear(req),
      ),
    );
  },
);
export const upsertIncomeBudgetLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertIncomeBudgetLineSchema.parse(req.body);
    res
      .status(201)
      .json(
        await incomeBudgetService.upsertIncomeBudgetLine(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteIncomeBudgetLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await incomeBudgetService.deleteIncomeBudgetLine(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
export const getIncomeBudgetComparisonHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await incomeBudgetService.getIncomeBudgetComparison(
        req.params.companyId,
        requireAuthContext(req),
        parseFiscalYear(req),
      ),
    );
  },
);

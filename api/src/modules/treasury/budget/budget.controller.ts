import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import { upsertBudgetLineSchema } from "./budget.schemas";
import * as budgetService from "./budget.service";

export const listBudgetLinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const fiscalYear = Number(req.query.fiscalYear);
    if (!fiscalYear)
      throw AppError.badRequest("Le paramètre ?fiscalYear=AAAA est requis");
    res.json(
      await budgetService.listBudgetLines(
        req.params.companyId,
        requireAuthContext(req),
        fiscalYear,
      ),
    );
  },
);
export const upsertBudgetLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertBudgetLineSchema.parse(req.body);
    res
      .status(201)
      .json(
        await budgetService.upsertBudgetLine(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteBudgetLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await budgetService.deleteBudgetLine(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

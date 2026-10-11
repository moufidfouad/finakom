import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createCashflowLineSchema,
  updateCashflowLineSchema,
} from "./cashflow.schemas";
import * as cashflowService from "./cashflow.service";

export const listCashflowLinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await cashflowService.listCashflowLines(
        req.params.planId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createCashflowLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createCashflowLineSchema.parse(req.body);
    res
      .status(201)
      .json(
        await cashflowService.createCashflowLine(
          req.params.planId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateCashflowLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateCashflowLineSchema.parse(req.body);
    res.json(
      await cashflowService.updateCashflowLine(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteCashflowLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await cashflowService.deleteCashflowLine(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

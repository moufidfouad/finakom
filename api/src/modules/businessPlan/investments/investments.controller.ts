import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createInvestmentSchema,
  updateInvestmentSchema,
} from "./investments.schemas";
import * as investmentsService from "./investments.service";

export const listInvestmentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await investmentsService.listInvestments(
        req.params.planId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createInvestmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createInvestmentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await investmentsService.createInvestment(
          req.params.planId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateInvestmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateInvestmentSchema.parse(req.body);
    res.json(
      await investmentsService.updateInvestment(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteInvestmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await investmentsService.deleteInvestment(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createBalanceLineSchema,
  updateBalanceLineSchema,
} from "./balance.schemas";
import * as balanceService from "./balance.service";

export const listBalanceLinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await balanceService.listBalanceLines(
        req.params.planId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createBalanceLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createBalanceLineSchema.parse(req.body);
    res
      .status(201)
      .json(
        await balanceService.createBalanceLine(
          req.params.planId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateBalanceLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateBalanceLineSchema.parse(req.body);
    res.json(
      await balanceService.updateBalanceLine(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteBalanceLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await balanceService.deleteBalanceLine(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

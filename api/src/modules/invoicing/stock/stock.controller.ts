import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createMovementSchema } from "./stock.schemas";
import * as stockService from "./stock.service";

export const listMovementsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await stockService.listMovements(
        req.params.productId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createMovementHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createMovementSchema.parse(req.body);
    res
      .status(201)
      .json(
        await stockService.createMovement(
          req.params.productId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteMovementHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await stockService.deleteMovement(
      req.params.movementId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

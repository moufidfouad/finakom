import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createAssetMovementSchema } from "./movements.schemas";
import * as movementsService from "./movements.service";

export const listMovementsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await movementsService.listMovements(
        req.params.fixedAssetId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createMovementHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAssetMovementSchema.parse(req.body);
    res
      .status(201)
      .json(
        await movementsService.createMovement(
          req.params.fixedAssetId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteMovementHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await movementsService.deleteMovement(
      req.params.movementId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
export const listCompanyMovementsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await movementsService.listCompanyMovements(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

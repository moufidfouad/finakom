import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createFundingSchema, updateFundingSchema } from "./fundings.schemas";
import * as fundingsService from "./fundings.service";

export const listFundingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await fundingsService.listFundings(
        req.params.planId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createFundingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createFundingSchema.parse(req.body);
    res
      .status(201)
      .json(
        await fundingsService.createFunding(
          req.params.planId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateFundingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateFundingSchema.parse(req.body);
    res.json(
      await fundingsService.updateFunding(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteFundingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await fundingsService.deleteFunding(req.params.id, requireAuthContext(req));
    res.status(204).send();
  },
);

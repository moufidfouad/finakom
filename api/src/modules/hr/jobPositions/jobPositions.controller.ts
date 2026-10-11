import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createJobPositionSchema,
  updateJobPositionSchema,
} from "./jobPositions.schemas";
import * as jobPositionsService from "./jobPositions.service";

export const listJobPositionsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await jobPositionsService.listJobPositions(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createJobPositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createJobPositionSchema.parse(req.body);
    res
      .status(201)
      .json(
        await jobPositionsService.createJobPosition(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateJobPositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateJobPositionSchema.parse(req.body);
    res.json(
      await jobPositionsService.updateJobPosition(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteJobPositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await jobPositionsService.deleteJobPosition(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

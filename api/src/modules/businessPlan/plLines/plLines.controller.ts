import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createPLLineSchema, updatePLLineSchema } from "./plLines.schemas";
import * as plLinesService from "./plLines.service";

export const listPLLinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await plLinesService.listPLLines(
        req.params.planId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createPLLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createPLLineSchema.parse(req.body);
    res
      .status(201)
      .json(
        await plLinesService.createPLLine(
          req.params.planId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updatePLLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updatePLLineSchema.parse(req.body);
    res.json(
      await plLinesService.updatePLLine(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deletePLLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await plLinesService.deletePLLine(req.params.id, requireAuthContext(req));
    res.status(204).send();
  },
);

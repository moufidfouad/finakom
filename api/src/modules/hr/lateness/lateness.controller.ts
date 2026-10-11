import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createLatenessSchema } from "./lateness.schemas";
import * as latenessService from "./lateness.service";

export const listLatenessHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await latenessService.listLateness(
        req.params.employeeId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createLatenessHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createLatenessSchema.parse(req.body);
    res
      .status(201)
      .json(
        await latenessService.createLateness(
          req.params.employeeId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteLatenessHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await latenessService.deleteLateness(
      req.params.recordId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

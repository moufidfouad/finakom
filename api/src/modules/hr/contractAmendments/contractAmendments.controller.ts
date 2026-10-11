import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createAmendmentSchema } from "./contractAmendments.schemas";
import * as contractAmendmentsService from "./contractAmendments.service";

export const listAmendmentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await contractAmendmentsService.listAmendments(
        req.params.employeeId,
        requireAuthContext(req),
      ),
    );
  },
);

export const createAmendmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAmendmentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await contractAmendmentsService.createAmendment(
          req.params.employeeId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);

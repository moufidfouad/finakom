import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createLeaveSchema, updateLeaveStatusSchema } from "./leave.schemas";
import * as leaveService from "./leave.service";

export const listLeaveHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await leaveService.listLeave(
        req.params.employeeId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createLeaveHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createLeaveSchema.parse(req.body);
    res
      .status(201)
      .json(
        await leaveService.createLeave(
          req.params.employeeId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateLeaveStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = updateLeaveStatusSchema.parse(req.body);
    res.json(
      await leaveService.updateLeaveStatus(
        req.params.recordId,
        requireAuthContext(req),
        status,
      ),
    );
  },
);
export const deleteLeaveHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await leaveService.deleteLeave(
      req.params.recordId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

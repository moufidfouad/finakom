import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createAttendanceSchema } from "./attendance.schemas";
import * as attendanceService from "./attendance.service";

export const listAttendanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await attendanceService.listAttendance(
        req.params.employeeId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createAttendanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAttendanceSchema.parse(req.body);
    res
      .status(201)
      .json(
        await attendanceService.createAttendance(
          req.params.employeeId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteAttendanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await attendanceService.deleteAttendance(
      req.params.recordId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

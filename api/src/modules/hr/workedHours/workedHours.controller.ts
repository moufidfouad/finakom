import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { upsertWorkedHoursSchema } from "./workedHours.schemas";
import * as workedHoursService from "./workedHours.service";

export const listWorkedHoursHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await workedHoursService.listWorkedHours(
        req.params.employeeId,
        requireAuthContext(req),
      ),
    );
  },
);
export const upsertWorkedHoursHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertWorkedHoursSchema.parse(req.body);
    res
      .status(201)
      .json(
        await workedHoursService.upsertWorkedHours(
          req.params.employeeId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteWorkedHoursHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await workedHoursService.deleteWorkedHours(
      req.params.recordId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

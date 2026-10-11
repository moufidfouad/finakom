import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { upsertPayrollSchema } from "./payroll.schemas";
import * as payrollService from "./payroll.service";

export const listPayrollHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await payrollService.listPayroll(
        req.params.employeeId,
        requireAuthContext(req),
      ),
    );
  },
);
export const upsertPayrollHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertPayrollSchema.parse(req.body);
    res
      .status(201)
      .json(
        await payrollService.upsertPayroll(
          req.params.employeeId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deletePayrollHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await payrollService.deletePayroll(
      req.params.recordId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

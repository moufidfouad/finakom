import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getBusinessPlanSummary } from "./summary.service";

export const getBusinessPlanSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await getBusinessPlanSummary(req.params.planId, requireAuthContext(req)),
    );
  },
);

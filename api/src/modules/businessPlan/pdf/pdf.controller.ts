import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { streamBusinessPlanPdf } from "./pdf.service";

export const getBusinessPlanPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await streamBusinessPlanPdf(req.params.id, requireAuthContext(req), res);
  },
);

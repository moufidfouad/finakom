import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getCollectionsReport } from "./collections.service";

export const getCollectionsReportHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await getCollectionsReport(req.params.companyId, requireAuthContext(req)),
    );
  },
);

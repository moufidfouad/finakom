import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getFixedAssetDashboard } from "./dashboard.service";

export const getFixedAssetDashboardHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await getFixedAssetDashboard(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

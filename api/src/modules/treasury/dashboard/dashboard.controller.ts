import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getTreasuryDashboard } from "./dashboard.service";

export const getTreasuryDashboardHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const fiscalYear = req.query.fiscalYear
      ? Number(req.query.fiscalYear)
      : new Date().getFullYear();
    res.json(
      await getTreasuryDashboard(
        req.params.companyId,
        requireAuthContext(req),
        fiscalYear,
      ),
    );
  },
);

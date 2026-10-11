import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getInvoicingDashboard } from "./dashboard.service";

export const getInvoicingDashboardHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await getInvoicingDashboard(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

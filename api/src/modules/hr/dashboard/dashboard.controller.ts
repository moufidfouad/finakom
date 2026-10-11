import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getHrDashboard } from "./dashboard.service";

export const getHrDashboardHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const periodParam = req.query.period as string | undefined;
    const periodDate = periodParam
      ? new Date(periodParam)
      : firstOfCurrentMonth();
    res.json(await getHrDashboard(req.params.companyId, auth, periodDate));
  },
);

function firstOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

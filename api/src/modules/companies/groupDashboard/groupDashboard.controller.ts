import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getGroupDashboard } from "./groupDashboard.service";

export const getGroupDashboardHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await getGroupDashboard(requireAuthContext(req)));
  },
);

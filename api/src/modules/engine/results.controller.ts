import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getFullReport } from "./results.service";

export const getControlesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await getFullReport(req.params.id, requireAuthContext(req));
    res.json(report.controles);
  },
);
export const getBilanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await getFullReport(req.params.id, requireAuthContext(req));
    res.json(report.bilan);
  },
);
export const getResultatHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await getFullReport(req.params.id, requireAuthContext(req));
    res.json(report.resultat);
  },
);
export const getRatiosHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await getFullReport(req.params.id, requireAuthContext(req));
    res.json(report.ratios);
  },
);
export const getSyntheseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const report = await getFullReport(req.params.id, requireAuthContext(req));
    res.json(report.synthese);
  },
);
export const getRapportCompletHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await getFullReport(req.params.id, requireAuthContext(req)));
  },
);

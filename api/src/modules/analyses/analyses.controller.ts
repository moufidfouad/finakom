import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createAnalysisSchema, updateAnalysisSchema } from "./analyses.schemas";
import * as analysesService from "./analyses.service";

export const listAnalysesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    res.json(await analysesService.listAnalyses(req.params.companyId, auth));
  },
);

export const createAnalysisHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = createAnalysisSchema.parse(req.body);
    res
      .status(201)
      .json(
        await analysesService.createAnalysis(req.params.companyId, auth, input),
      );
  },
);

export const getAnalysisHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    res.json(await analysesService.getAnalysis(req.params.id, auth));
  },
);

export const updateAnalysisHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = updateAnalysisSchema.parse(req.body);
    res.json(await analysesService.updateAnalysis(req.params.id, auth, input));
  },
);

export const deleteAnalysisHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    await analysesService.deleteAnalysis(req.params.id, auth);
    res.status(204).send();
  },
);

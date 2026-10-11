import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as publicCvsService from "./publicCvs.service";

export const listPublicCvsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json(await publicCvsService.listPublicCvs());
  },
);

export const getPublicCvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await publicCvsService.getPublicCv(req.params.cvId));
  },
);

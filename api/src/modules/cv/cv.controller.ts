import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import {
  createCvSchema,
  updateCvSchema,
  updateCvVisibilitySchema,
} from "./cv.schemas";
import * as cvService from "./cv.service";

export const listCvsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    res.json(await cvService.listCvs(req.candidate.candidateId));
  },
);

export const getCvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    res.json(await cvService.getCv(req.params.cvId, req.candidate.candidateId));
  },
);

export const createCvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    const input = createCvSchema.parse(req.body);
    res
      .status(201)
      .json(await cvService.createCv(req.candidate.candidateId, input));
  },
);

export const updateCvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    const input = updateCvSchema.parse(req.body);
    res.json(
      await cvService.updateCv(
        req.params.cvId,
        req.candidate.candidateId,
        input,
      ),
    );
  },
);

export const updateCvVisibilityHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    const input = updateCvVisibilitySchema.parse(req.body);
    res.json(
      await cvService.updateCvVisibility(
        req.params.cvId,
        req.candidate.candidateId,
        input,
      ),
    );
  },
);

export const deleteCvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    await cvService.deleteCv(req.params.cvId, req.candidate.candidateId);
    res.status(204).send();
  },
);

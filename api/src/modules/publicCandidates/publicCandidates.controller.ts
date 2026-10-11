import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  contactCandidateSchema,
  listPublicCvsQuerySchema,
} from "./publicCandidates.schemas";
import * as publicCandidatesService from "./publicCandidates.service";

export const listPublicCvsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listPublicCvsQuerySchema.parse(req.query);
    res.json(await publicCandidatesService.listPublicCvs(query));
  },
);

export const getPublicCvFacetsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json(await publicCandidatesService.getPublicCvFacets());
  },
);

export const getPublicCvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await publicCandidatesService.getPublicCv(req.params.cvId));
  },
);

export const contactCandidateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = contactCandidateSchema.parse(req.body);
    await publicCandidatesService.contactCandidateViaCv(req.params.cvId, input);
    res.status(200).json({ success: true });
  },
);

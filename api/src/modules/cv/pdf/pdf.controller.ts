import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { streamCvPdf } from "./pdf.service";

export const streamCvPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    await streamCvPdf(req.params.cvId, req.candidate.candidateId, res);
  },
);

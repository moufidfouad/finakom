import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { streamDocumentPdf } from "./pdf.service";

export const getDocumentPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await streamDocumentPdf(req.params.id, requireAuthContext(req), res);
  },
);

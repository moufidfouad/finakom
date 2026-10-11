import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { streamPurchaseDocumentPdf } from "./pdf.service";

export const getPurchaseDocumentPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await streamPurchaseDocumentPdf(
      req.params.id,
      requireAuthContext(req),
      res,
    );
  },
);

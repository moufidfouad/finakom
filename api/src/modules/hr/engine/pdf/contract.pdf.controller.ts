import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { streamContractPdf } from "./contract.pdf.service";

export const getContractPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await streamContractPdf(req.params.id, requireAuthContext(req), res);
  },
);

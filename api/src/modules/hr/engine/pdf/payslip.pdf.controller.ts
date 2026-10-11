import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import { streamPayslipPdf } from "./payslip.pdf.service";

export const getPayslipPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const periodParam = req.query.period as string | undefined;
    if (!periodParam)
      throw AppError.badRequest("Le paramètre ?period=AAAA-MM-01 est requis");
    await streamPayslipPdf(
      req.params.id,
      requireAuthContext(req),
      new Date(periodParam),
      res,
    );
  },
);

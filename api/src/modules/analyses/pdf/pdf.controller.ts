import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { streamFinancialStatementsPdf } from "./pdf.service";

export const getFinancialStatementsPdfHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await streamFinancialStatementsPdf(
      req.params.id,
      requireAuthContext(req),
      res,
    );
  },
);

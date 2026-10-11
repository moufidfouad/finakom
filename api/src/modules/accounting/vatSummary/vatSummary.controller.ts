import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { vatSummaryQuerySchema } from "./vatSummary.schemas";
import { getVatSummary } from "./vatSummary.service";

export const getVatSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = vatSummaryQuerySchema.parse(req.query);
    res.json(
      await getVatSummary(req.params.companyId, requireAuthContext(req), query),
    );
  },
);

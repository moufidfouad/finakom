import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { postAnnualDepreciation } from "./postDepreciation.service";

export const postAnnualDepreciationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await postAnnualDepreciation(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

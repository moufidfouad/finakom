import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import { getPayslip } from "./payslip.service";

export const getPayslipHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const periodParam = req.query.period as string | undefined;
    if (!periodParam)
      throw AppError.badRequest("Le paramètre ?period=AAAA-MM-01 est requis");
    res.json(await getPayslip(req.params.id, auth, new Date(periodParam)));
  },
);

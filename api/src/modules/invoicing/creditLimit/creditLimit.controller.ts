import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getClientCreditStatus } from "./creditLimit.service";

const querySchema = z.object({
  amount: z.coerce.number().nonnegative().default(0),
});

export const getClientCreditStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { amount } = querySchema.parse(req.query);
    res.json(
      await getClientCreditStatus(
        req.params.id,
        requireAuthContext(req),
        amount,
      ),
    );
  },
);

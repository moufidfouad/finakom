import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createPaymentSchema } from "./payments.schemas";
import * as paymentsService from "./payments.service";

export const listPaymentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await paymentsService.listPayments(
        req.params.documentId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createPaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createPaymentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await paymentsService.createPayment(
          req.params.documentId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deletePaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await paymentsService.deletePayment(
      req.params.paymentId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

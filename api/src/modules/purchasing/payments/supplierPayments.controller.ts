import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createSupplierPaymentSchema } from "./supplierPayments.schemas";
import * as supplierPaymentsService from "./supplierPayments.service";

export const listSupplierPaymentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await supplierPaymentsService.listSupplierPayments(
        req.params.documentId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createSupplierPaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createSupplierPaymentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await supplierPaymentsService.createSupplierPayment(
          req.params.documentId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteSupplierPaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await supplierPaymentsService.deleteSupplierPayment(
      req.params.paymentId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

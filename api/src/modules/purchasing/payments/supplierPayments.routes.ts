import { Router } from "express";
import {
  createSupplierPaymentHandler,
  deleteSupplierPaymentHandler,
  listSupplierPaymentsHandler,
} from "./supplierPayments.controller";

const router = Router({ mergeParams: true });
router.get("/", listSupplierPaymentsHandler);
router.post("/", createSupplierPaymentHandler);
router.delete("/:paymentId", deleteSupplierPaymentHandler);
export default router;

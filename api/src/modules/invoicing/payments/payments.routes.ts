import { Router } from "express";
import {
  createPaymentHandler,
  deletePaymentHandler,
  listPaymentsHandler,
} from "./payments.controller";

const router = Router({ mergeParams: true });
router.get("/", listPaymentsHandler);
router.post("/", createPaymentHandler);
router.delete("/:paymentId", deletePaymentHandler);
export default router;

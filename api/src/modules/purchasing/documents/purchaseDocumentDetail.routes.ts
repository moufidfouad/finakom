import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  convertOrderToInvoiceHandler,
  deletePurchaseDocumentHandler,
  getPurchaseDocumentHandler,
  updatePurchaseDocumentHandler,
  updatePurchaseStatusHandler,
} from "./purchaseDocuments.controller";
import supplierPaymentsRouter from "@/modules/purchasing/payments/supplierPayments.routes";
import purchasePdfRouter from "@/modules/purchasing/pdf/pdf.routes";

const router = Router();
router.use(requireAuth);
router.get("/:id", getPurchaseDocumentHandler);
router.put("/:id", updatePurchaseDocumentHandler);
router.delete("/:id", deletePurchaseDocumentHandler);
router.patch("/:id/status", updatePurchaseStatusHandler);
router.post("/:id/convert-to-invoice", convertOrderToInvoiceHandler);
router.use("/:documentId/payments", supplierPaymentsRouter);
router.use("/:id", purchasePdfRouter);
export default router;

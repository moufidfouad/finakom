import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  convertToInvoiceHandler,
  createDeliveryNoteFromInvoiceHandler,
  deleteDocumentHandler,
  deliverLineHandler,
  getDocumentHandler,
  updateDocumentHandler,
  updateStatusHandler,
} from "./documents.controller";
import paymentsRouter from "@/modules/invoicing/payments/payments.routes";
import pdfRouter from "@/modules/invoicing/pdf/pdf.routes";

const router = Router();
router.use(requireAuth);
router.get("/:id", getDocumentHandler);
router.put("/:id", updateDocumentHandler);
router.delete("/:id", deleteDocumentHandler);
router.patch("/:id/status", updateStatusHandler);
router.patch("/:id/lines/:lineId/deliver", deliverLineHandler);
router.post("/:id/convert-to-invoice", convertToInvoiceHandler);
router.post("/:id/create-delivery-note", createDeliveryNoteFromInvoiceHandler);
router.use("/:documentId/payments", paymentsRouter);
router.use("/:id", pdfRouter);
export default router;

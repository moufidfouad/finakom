import { Router } from "express";
import {
  createPurchaseDocumentHandler,
  exportPurchaseDocumentsCsvHandler,
  listPurchaseDocumentsHandler,
} from "./purchaseDocuments.controller";

const router = Router({ mergeParams: true });
router.get("/", listPurchaseDocumentsHandler);
router.get("/export.csv", exportPurchaseDocumentsCsvHandler);
router.post("/", createPurchaseDocumentHandler);
export default router;

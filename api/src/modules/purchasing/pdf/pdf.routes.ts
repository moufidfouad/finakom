import { Router } from "express";
import { getPurchaseDocumentPdfHandler } from "./pdf.controller";

const router = Router({ mergeParams: true });
router.get("/pdf", getPurchaseDocumentPdfHandler);
export default router;

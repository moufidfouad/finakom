import { Router } from "express";
import { getDocumentPdfHandler } from "./pdf.controller";

const router = Router({ mergeParams: true });
router.get("/pdf", getDocumentPdfHandler);
export default router;

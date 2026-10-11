import { Router } from "express";
import {
  createDocumentHandler,
  exportDocumentsCsvHandler,
  listDocumentsHandler,
} from "./documents.controller";

const router = Router({ mergeParams: true });
router.get("/", listDocumentsHandler);
router.get("/export.csv", exportDocumentsCsvHandler);
router.post("/", createDocumentHandler);
export default router;

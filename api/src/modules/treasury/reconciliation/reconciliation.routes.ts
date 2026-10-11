import { Router } from "express";
import multer from "multer";
import {
  getReconciliationSummaryHandler,
  getSuggestedMatchesHandler,
  importStatementHandler,
  listStatementLinesHandler,
} from "./reconciliation.controller";

const router = Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/lines", listStatementLinesHandler);
router.post("/lines/import", upload.single("file"), importStatementHandler);
router.get("/suggested-matches", getSuggestedMatchesHandler);
router.get("/summary", getReconciliationSummaryHandler);
export default router;

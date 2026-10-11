import { Router } from "express";
import multer from "multer";
import {
  getBalanceHandler,
  generateBalanceFromLedgerHandler,
  importBalanceHandler,
  replaceBalanceHandler,
} from "./balance.controller";

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", getBalanceHandler);
router.put("/", replaceBalanceHandler);
router.post("/import", upload.single("file"), importBalanceHandler);
router.post("/generate-from-ledger", generateBalanceFromLedgerHandler);

export default router;

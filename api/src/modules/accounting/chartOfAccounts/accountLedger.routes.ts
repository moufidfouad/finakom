import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  exportAccountLedgerCsvHandler,
  getAccountLedgerHandler,
} from "@/modules/accounting/journalEntries/journalEntries.controller";

const router = Router();
router.use(requireAuth);
router.get("/:id/ledger", getAccountLedgerHandler);
router.get("/:id/ledger/export.csv", exportAccountLedgerCsvHandler);
export default router;

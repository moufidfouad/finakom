import { Router } from "express";
import {
  createManualEntryHandler,
  exportTrialBalanceCsvHandler,
  getTrialBalanceHandler,
  listEntriesHandler,
} from "./journalEntries.controller";

const router = Router({ mergeParams: true });
router.get("/", listEntriesHandler);
router.post("/", createManualEntryHandler);
export default router;

export const trialBalanceRouter = Router({ mergeParams: true });
trialBalanceRouter.get("/", getTrialBalanceHandler);
trialBalanceRouter.get("/export.csv", exportTrialBalanceCsvHandler);

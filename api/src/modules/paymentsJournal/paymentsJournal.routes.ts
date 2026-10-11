import { Router } from "express";
import { getPaymentsJournalHandler } from "./paymentsJournal.controller";

const router = Router({ mergeParams: true });
router.get("/", getPaymentsJournalHandler);
export default router;

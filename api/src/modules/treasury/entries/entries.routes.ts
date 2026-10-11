import { Router } from "express";
import { createEntryHandler, listEntriesHandler } from "./entries.controller";

const router = Router({ mergeParams: true });
router.get("/", listEntriesHandler);
router.post("/", createEntryHandler);
export default router;

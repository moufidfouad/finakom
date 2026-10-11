import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { deleteEntryHandler } from "./journalEntries.controller";

const router = Router();
router.use(requireAuth);
router.delete("/:id", deleteEntryHandler);
export default router;

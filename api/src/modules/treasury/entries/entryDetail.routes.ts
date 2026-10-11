import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { deleteEntryHandler, updateEntryHandler } from "./entries.controller";

const router = Router();
router.use(requireAuth);
router.put("/:id", updateEntryHandler);
router.delete("/:id", deleteEntryHandler);
export default router;

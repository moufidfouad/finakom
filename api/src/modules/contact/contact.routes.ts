import { Router } from "express";
import { rateLimit } from "@/middlewares/rateLimit";
import { requireAuth } from "@/middlewares/requireAuth";
import { requireAdmin } from "@/middlewares/requireAdmin";
import {
  deleteContactMessageHandler,
  listContactMessagesHandler,
  markContactMessageReadHandler,
  submitContactHandler,
} from "./contact.controller";

const router = Router();

router.post("/", rateLimit(5, 10 * 60 * 1000), submitContactHandler);
router.get("/", requireAuth, requireAdmin, listContactMessagesHandler);
router.patch(
  "/:id/read",
  requireAuth,
  requireAdmin,
  markContactMessageReadHandler,
);
router.delete("/:id", requireAuth, requireAdmin, deleteContactMessageHandler);

export default router;

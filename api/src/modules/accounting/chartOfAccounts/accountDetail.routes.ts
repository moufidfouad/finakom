import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteAccountHandler,
  updateAccountHandler,
} from "./chartOfAccounts.controller";

const router = Router();
router.use(requireAuth);
router.put("/:id", updateAccountHandler);
router.delete("/:id", deleteAccountHandler);
export default router;

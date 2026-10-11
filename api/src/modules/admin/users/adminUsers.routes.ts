import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { requireSuperAdmin } from "@/middlewares/requireAdmin";
import {
  getUserHandler,
  listUsersHandler,
  updateUserHandler,
} from "./adminUsers.controller";

const router = Router();
router.use(requireAuth, requireSuperAdmin);
router.get("/", listUsersHandler);
router.get("/:id", getUserHandler);
router.put("/:id", updateUserHandler);
export default router;

import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteSupplierHandler,
  updateSupplierHandler,
} from "./suppliers.controller";

const router = Router();
router.use(requireAuth);
router.put("/:id", updateSupplierHandler);
router.delete("/:id", deleteSupplierHandler);
export default router;

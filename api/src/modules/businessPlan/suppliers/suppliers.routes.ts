import { Router } from "express";
import {
  createSupplierHandler,
  deleteSupplierHandler,
  listSuppliersHandler,
  updateSupplierHandler,
} from "./suppliers.controller";

const router = Router({ mergeParams: true });
router.get("/", listSuppliersHandler);
router.post("/", createSupplierHandler);
router.put("/:id", updateSupplierHandler);
router.delete("/:id", deleteSupplierHandler);
export default router;

import { Router } from "express";
import {
  createSupplierHandler,
  exportSuppliersCsvHandler,
  listSuppliersHandler,
} from "./suppliers.controller";

const router = Router({ mergeParams: true });
router.get("/", listSuppliersHandler);
router.get("/export.csv", exportSuppliersCsvHandler);
router.post("/", createSupplierHandler);
export default router;

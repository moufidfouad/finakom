import { Router } from "express";
import {
  createProductHandler,
  exportProductsCsvHandler,
  listProductsHandler,
} from "./products.controller";

const router = Router({ mergeParams: true });
router.get("/", listProductsHandler);
router.get("/export.csv", exportProductsCsvHandler);
router.post("/", createProductHandler);
export default router;

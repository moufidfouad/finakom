import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteProductHandler,
  getProductHandler,
  updateProductHandler,
} from "./products.controller";
import stockRouter from "@/modules/invoicing/stock/stock.routes";

const router = Router();
router.use(requireAuth);
router.get("/:id", getProductHandler);
router.put("/:id", updateProductHandler);
router.delete("/:id", deleteProductHandler);
router.use("/:productId/movements", stockRouter);
export default router;

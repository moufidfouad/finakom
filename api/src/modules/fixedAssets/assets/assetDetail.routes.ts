import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteFixedAssetHandler,
  getFixedAssetHandler,
  updateFixedAssetHandler,
} from "./assets.controller";
import movementsRouter from "@/modules/fixedAssets/movements/movements.routes";

const router = Router();
router.use(requireAuth);
router.get("/:id", getFixedAssetHandler);
router.put("/:id", updateFixedAssetHandler);
router.delete("/:id", deleteFixedAssetHandler);
router.use("/:fixedAssetId/movements", movementsRouter);
export default router;

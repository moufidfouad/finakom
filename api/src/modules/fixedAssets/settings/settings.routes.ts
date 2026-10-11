import { Router } from "express";
import {
  getFixedAssetSettingsHandler,
  updateFixedAssetSettingsHandler,
} from "./settings.controller";

const router = Router({ mergeParams: true });
router.get("/", getFixedAssetSettingsHandler);
router.put("/", updateFixedAssetSettingsHandler);
export default router;

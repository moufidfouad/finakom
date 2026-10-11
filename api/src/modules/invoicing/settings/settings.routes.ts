import { Router } from "express";
import {
  getSettingsHandler,
  updateSettingsHandler,
} from "./settings.controller";

const router = Router({ mergeParams: true });
router.get("/", getSettingsHandler);
router.put("/", updateSettingsHandler);
export default router;

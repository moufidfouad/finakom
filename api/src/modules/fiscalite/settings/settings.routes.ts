import { Router } from "express";
import {
  getTaxSettingsHandler,
  updateTaxSettingsHandler,
} from "./settings.controller";

const router = Router({ mergeParams: true });
router.get("/", getTaxSettingsHandler);
router.put("/", updateTaxSettingsHandler);
export default router;

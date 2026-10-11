import { Router } from "express";
import {
  getTreasurySettingsHandler,
  updateTreasurySettingsHandler,
} from "./settings.controller";

const router = Router({ mergeParams: true });
router.get("/", getTreasurySettingsHandler);
router.put("/", updateTreasurySettingsHandler);
export default router;

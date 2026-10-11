import { Router } from "express";
import {
  createFixedAssetHandler,
  listFixedAssetsHandler,
} from "./assets.controller";

const router = Router({ mergeParams: true });
router.get("/", listFixedAssetsHandler);
router.post("/", createFixedAssetHandler);
export default router;

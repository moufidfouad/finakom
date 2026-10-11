import { Router } from "express";
import {
  createFundingHandler,
  deleteFundingHandler,
  listFundingsHandler,
  updateFundingHandler,
} from "./fundings.controller";

const router = Router({ mergeParams: true });
router.get("/", listFundingsHandler);
router.post("/", createFundingHandler);
router.put("/:id", updateFundingHandler);
router.delete("/:id", deleteFundingHandler);
export default router;

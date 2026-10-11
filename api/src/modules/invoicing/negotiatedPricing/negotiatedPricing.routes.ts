import { Router } from "express";
import {
  deleteNegotiatedPriceHandler,
  listNegotiatedPricesHandler,
  resolveEffectivePriceHandler,
  upsertNegotiatedPriceHandler,
} from "./negotiatedPricing.controller";

const router = Router({ mergeParams: true });
router.get("/", listNegotiatedPricesHandler);
router.post("/", upsertNegotiatedPriceHandler);
router.delete("/:priceId", deleteNegotiatedPriceHandler);
router.get("/resolve/:productId", resolveEffectivePriceHandler);
export default router;

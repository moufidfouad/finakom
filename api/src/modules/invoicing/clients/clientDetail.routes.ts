import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { deleteClientHandler, updateClientHandler } from "./clients.controller";
import { getClientCreditStatusHandler } from "@/modules/invoicing/creditLimit/creditLimit.controller";

const router = Router();
router.use(requireAuth);
router.put("/:id", updateClientHandler);
router.delete("/:id", deleteClientHandler);
router.get("/:id/credit-status", getClientCreditStatusHandler);
export default router;

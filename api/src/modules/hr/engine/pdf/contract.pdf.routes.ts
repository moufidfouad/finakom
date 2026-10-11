import { Router } from "express";
import { getContractPdfHandler } from "./contract.pdf.controller";

const router = Router({ mergeParams: true });
router.get("/contract/pdf", getContractPdfHandler);
export default router;

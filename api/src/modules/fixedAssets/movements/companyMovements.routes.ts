import { Router } from "express";
import { listCompanyMovementsHandler } from "./movements.controller";

const router = Router({ mergeParams: true });
router.get("/", listCompanyMovementsHandler);
export default router;

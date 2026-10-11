import { Router } from "express";
import {
  closeFiscalYearHandler,
  listFiscalYearsHandler,
} from "./fiscalYearClosing.controller";

const router = Router({ mergeParams: true });
router.get("/", listFiscalYearsHandler);
router.post("/close", closeFiscalYearHandler);
export default router;

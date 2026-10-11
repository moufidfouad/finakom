import { Router } from "express";
import {
  createClientHandler,
  exportClientsCsvHandler,
  listClientsHandler,
} from "./clients.controller";

const router = Router({ mergeParams: true });
router.get("/", listClientsHandler);
router.get("/export.csv", exportClientsCsvHandler);
router.post("/", createClientHandler);
export default router;

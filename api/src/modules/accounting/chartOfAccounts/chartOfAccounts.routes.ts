import { Router } from "express";
import {
  createAccountHandler,
  listAccountsHandler,
  seedDefaultAccountsHandler,
} from "./chartOfAccounts.controller";

const router = Router({ mergeParams: true });
router.get("/", listAccountsHandler);
router.post("/", createAccountHandler);
router.post("/seed-default", seedDefaultAccountsHandler);
export default router;

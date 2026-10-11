import { Router } from "express";
import {
  createMemberHandler,
  listMembersHandler,
  removeMemberHandler,
  updateMemberRoleHandler,
} from "./members.controller";

const router = Router({ mergeParams: true });
router.get("/", listMembersHandler);
router.post("/", createMemberHandler);
router.patch("/:userId", updateMemberRoleHandler);
router.delete("/:userId", removeMemberHandler);
export default router;

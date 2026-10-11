import { Router } from "express";
import { requireCandidateAuth } from "@/middlewares/requireCandidateAuth";
import {
  listCandidateConversationsHandler,
  listCandidateMessagesHandler,
  markCandidateConversationReadHandler,
  reportCandidateConversationHandler,
  sendCandidateMessageHandler,
  startCandidateConversationHandler,
} from "./candidateConversations.controller";

const router = Router();
router.use(requireCandidateAuth);

router.post("/", startCandidateConversationHandler);
router.get("/", listCandidateConversationsHandler);
router.get("/:conversationId/messages", listCandidateMessagesHandler);
router.post("/:conversationId/messages", sendCandidateMessageHandler);
router.patch("/:conversationId/read", markCandidateConversationReadHandler);
router.post("/:conversationId/report", reportCandidateConversationHandler);

export default router;

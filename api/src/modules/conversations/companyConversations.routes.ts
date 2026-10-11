import { Router } from "express";
import {
  listCompanyConversationsHandler,
  listCompanyMessagesHandler,
  markCompanyConversationReadHandler,
  reportCompanyConversationHandler,
  sendCompanyMessageHandler,
  startCompanyConversationHandler,
} from "./companyConversations.controller";

const router = Router({ mergeParams: true });

router.post("/", startCompanyConversationHandler);
router.get("/", listCompanyConversationsHandler);
router.get("/:conversationId/messages", listCompanyMessagesHandler);
router.post("/:conversationId/messages", sendCompanyMessageHandler);
router.patch("/:conversationId/read", markCompanyConversationReadHandler);
router.post("/:conversationId/report", reportCompanyConversationHandler);

export default router;

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import * as conversationsService from "./conversations.service";
import {
  listMessagesQuerySchema,
  reportConversationSchema,
  sendMessageSchema,
  startConversationFromCompanySchema,
} from "./conversations.schemas";

export const startCompanyConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const { companyId } = req.params;
    await conversationsService.assertCompanyMembership(companyId, auth);

    const input = startConversationFromCompanySchema.parse(req.body);
    const target = input.candidateId
      ? { type: "CANDIDATE" as const, candidateId: input.candidateId }
      : {
          type: "COMPANY" as const,
          companyId: input.targetCompanyId as string,
        };

    const conversation = await conversationsService.findOrCreateConversation(
      { type: "COMPANY", companyId },
      target,
    );
    res.status(201).json(conversation);
  },
);

export const listCompanyConversationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const { companyId } = req.params;
    await conversationsService.assertCompanyMembership(companyId, auth);
    res.json(
      await conversationsService.listConversations({
        type: "COMPANY",
        companyId,
        userId: auth.userId,
      }),
    );
  },
);

export const listCompanyMessagesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const { companyId, conversationId } = req.params;
    await conversationsService.assertCompanyMembership(companyId, auth);
    const query = listMessagesQuerySchema.parse(req.query);
    res.json(
      await conversationsService.listMessages(
        conversationId,
        { type: "COMPANY", companyId, userId: auth.userId },
        query.before,
      ),
    );
  },
);

export const sendCompanyMessageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const { companyId, conversationId } = req.params;
    await conversationsService.assertCompanyMembership(companyId, auth);
    const input = sendMessageSchema.parse(req.body);
    const message = await conversationsService.sendMessage(
      conversationId,
      { type: "COMPANY", companyId, userId: auth.userId },
      input.body,
    );
    res.status(201).json(message);
  },
);

export const markCompanyConversationReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const { companyId, conversationId } = req.params;
    await conversationsService.assertCompanyMembership(companyId, auth);
    await conversationsService.markConversationRead(conversationId, {
      type: "COMPANY",
      companyId,
      userId: auth.userId,
    });
    res.json({ success: true });
  },
);

export const reportCompanyConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const { companyId, conversationId } = req.params;
    await conversationsService.assertCompanyMembership(companyId, auth);
    const input = reportConversationSchema.parse(req.body);
    await conversationsService.reportConversation(
      conversationId,
      { type: "COMPANY", companyId, userId: auth.userId },
      input.reason,
    );
    res.status(201).json({ success: true });
  },
);

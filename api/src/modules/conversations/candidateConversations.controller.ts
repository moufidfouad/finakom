import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import * as conversationsService from "./conversations.service";
import {
  listMessagesQuerySchema,
  reportConversationSchema,
  sendMessageSchema,
  startConversationFromCandidateSchema,
} from "./conversations.schemas";

function requireCandidate(req: Request) {
  if (!req.candidate) throw AppError.unauthorized();
  return req.candidate;
}

export const startCandidateConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { candidateId } = requireCandidate(req);
    const input = startConversationFromCandidateSchema.parse(req.body);
    const conversation = await conversationsService.findOrCreateConversation(
      { type: "CANDIDATE", candidateId },
      { type: "COMPANY", companyId: input.companyId },
    );
    res.status(201).json(conversation);
  },
);

export const listCandidateConversationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { candidateId } = requireCandidate(req);
    res.json(
      await conversationsService.listConversations({
        type: "CANDIDATE",
        candidateId,
      }),
    );
  },
);

export const listCandidateMessagesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { candidateId } = requireCandidate(req);
    const query = listMessagesQuerySchema.parse(req.query);
    res.json(
      await conversationsService.listMessages(
        req.params.conversationId,
        { type: "CANDIDATE", candidateId },
        query.before,
      ),
    );
  },
);

export const sendCandidateMessageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { candidateId } = requireCandidate(req);
    const input = sendMessageSchema.parse(req.body);
    const message = await conversationsService.sendMessage(
      req.params.conversationId,
      { type: "CANDIDATE", candidateId },
      input.body,
    );
    res.status(201).json(message);
  },
);

export const markCandidateConversationReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { candidateId } = requireCandidate(req);
    await conversationsService.markConversationRead(req.params.conversationId, {
      type: "CANDIDATE",
      candidateId,
    });
    res.json({ success: true });
  },
);

export const reportCandidateConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { candidateId } = requireCandidate(req);
    const input = reportConversationSchema.parse(req.body);
    await conversationsService.reportConversation(
      req.params.conversationId,
      { type: "CANDIDATE", candidateId },
      input.reason,
    );
    res.status(201).json({ success: true });
  },
);

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { contactSchema } from "./contact.schemas";
import * as contactService from "./contact.service";

export const submitContactHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = contactSchema.parse(req.body);
    if (input.website) {
      res.status(201).json({ success: true });
      return;
    }
    await contactService.createContactMessage(input);
    res.status(201).json({ success: true });
  },
);

export const listContactMessagesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const result = await contactService.listContactMessages({
      page,
      pageSize,
      unreadOnly,
    });
    res.json(result);
  },
);

export const markContactMessageReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const isRead = req.body.isRead ?? true;
    const message = await contactService.markContactMessageAsRead(
      req.params.id,
      isRead,
    );
    res.json(message);
  },
);

export const deleteContactMessageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await contactService.deleteContactMessage(req.params.id);
    res.status(204).send();
  },
);

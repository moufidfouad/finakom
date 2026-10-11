import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { contactCandidateSchema } from "./contactCandidate.schemas";
import * as contactCandidateService from "./contactCandidate.service";

export const submitContactCandidateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = contactCandidateSchema.parse(req.body);
    // Honeypot rempli = probablement un bot : faux succès, jamais d'envoi réel
    // (même patron que contact.controller.ts) — ne pas révéler la détection.
    if (input.website) {
      res.status(200).json({ success: true });
      return;
    }
    await contactCandidateService.contactCandidate(req.params.cvId, input);
    res.status(200).json({ success: true });
  },
);

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { upsertSettingsSchema } from "./settings.schemas";
import * as settingsService from "./settings.service";

export const getSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await settingsService.getSettings(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const updateSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertSettingsSchema.parse(req.body);
    res.json(
      await settingsService.updateSettings(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

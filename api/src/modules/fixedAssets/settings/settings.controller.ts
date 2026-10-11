import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { upsertFixedAssetSettingsSchema } from "./settings.schemas";
import * as settingsService from "./settings.service";

export const getFixedAssetSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await settingsService.getFixedAssetSettings(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const updateFixedAssetSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertFixedAssetSettingsSchema.parse(req.body);
    res.json(
      await settingsService.updateFixedAssetSettings(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

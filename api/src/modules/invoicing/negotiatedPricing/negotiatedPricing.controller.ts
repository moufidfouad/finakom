import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createNegotiatedPriceSchema } from "./negotiatedPricing.schemas";
import * as negotiatedPricingService from "./negotiatedPricing.service";

export const listNegotiatedPricesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await negotiatedPricingService.listNegotiatedPrices(
        req.params.clientId,
        requireAuthContext(req),
      ),
    );
  },
);

export const upsertNegotiatedPriceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createNegotiatedPriceSchema.parse(req.body);
    res
      .status(201)
      .json(
        await negotiatedPricingService.upsertNegotiatedPrice(
          req.params.clientId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);

export const deleteNegotiatedPriceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await negotiatedPricingService.deleteNegotiatedPrice(
      req.params.priceId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

export const resolveEffectivePriceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await negotiatedPricingService.resolveEffectivePrice(
        req.params.clientId,
        req.params.productId,
        requireAuthContext(req),
      ),
    );
  },
);

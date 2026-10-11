import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createBusinessPlanSchema,
  updateBusinessPlanSchema,
} from "./plan.schemas";
import * as planService from "./plan.service";

export const listBusinessPlansHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await planService.listBusinessPlans(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createBusinessPlanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createBusinessPlanSchema.parse(req.body);
    res
      .status(201)
      .json(
        await planService.createBusinessPlan(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const getBusinessPlanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await planService.getBusinessPlan(req.params.id, requireAuthContext(req)),
    );
  },
);
export const updateBusinessPlanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateBusinessPlanSchema.parse(req.body);
    res.json(
      await planService.updateBusinessPlan(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteBusinessPlanHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await planService.deleteBusinessPlan(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { updateUserSchema } from "./adminUsers.schemas";
import * as adminUsersService from "./adminUsers.service";

export const listUsersHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json(await adminUsersService.listUsers());
  },
);

export const getUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(await adminUsersService.getUser(req.params.id));
  },
);

export const updateUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = updateUserSchema.parse(req.body);
    res.json(
      await adminUsersService.updateUser(req.params.id, auth.userId, input),
    );
  },
);

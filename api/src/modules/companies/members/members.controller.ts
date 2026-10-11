import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createMemberSchema, updateMemberRoleSchema } from "./members.schemas";
import * as membersService from "./members.service";

export const listMembersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await membersService.listMembers(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const createMemberHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createMemberSchema.parse(req.body);
    res
      .status(201)
      .json(
        await membersService.createMember(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);

export const updateMemberRoleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { role } = updateMemberRoleSchema.parse(req.body);
    res.json(
      await membersService.updateMemberRole(
        req.params.companyId,
        req.params.userId,
        requireAuthContext(req),
        role,
      ),
    );
  },
);

export const removeMemberHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await membersService.removeMember(
      req.params.companyId,
      req.params.userId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

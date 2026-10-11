import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createAccountSchema,
  updateAccountSchema,
} from "./chartOfAccounts.schemas";
import * as chartOfAccountsService from "./chartOfAccounts.service";

export const listAccountsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await chartOfAccountsService.listAccounts(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const seedDefaultAccountsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await chartOfAccountsService.seedDefaultAccounts(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createAccountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAccountSchema.parse(req.body);
    res
      .status(201)
      .json(
        await chartOfAccountsService.createAccount(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateAccountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateAccountSchema.parse(req.body);
    res.json(
      await chartOfAccountsService.updateAccount(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteAccountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await chartOfAccountsService.deleteAccount(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

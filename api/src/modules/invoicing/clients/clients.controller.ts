import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createClientSchema, updateClientSchema } from "./clients.schemas";
import * as clientsService from "./clients.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

type ClientRow = Awaited<ReturnType<typeof clientsService.listClients>>[number];

export const listClientsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await clientsService.listClients(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const exportClientsCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const clients = await clientsService.listClients(
      req.params.companyId,
      requireAuthContext(req),
    );
    const csv = buildCsv<ClientRow>(clients, [
      { header: "Code", value: (c) => c.code },
      { header: "Nom", value: (c) => c.name },
      { header: "Type", value: (c) => c.type },
      { header: "Adresse", value: (c) => c.address },
      { header: "Téléphone", value: (c) => c.phone },
      { header: "Email", value: (c) => c.email },
      { header: "RCCM", value: (c) => c.rccm },
      { header: "Qualité", value: (c) => c.quality },
    ]);
    sendCsv(res, "clients.csv", csv);
  },
);
export const createClientHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createClientSchema.parse(req.body);
    res
      .status(201)
      .json(
        await clientsService.createClient(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateClientHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateClientSchema.parse(req.body);
    res.json(
      await clientsService.updateClient(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteClientHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await clientsService.deleteClient(req.params.id, requireAuthContext(req));
    res.status(204).send();
  },
);

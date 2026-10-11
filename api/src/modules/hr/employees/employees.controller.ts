import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employees.schemas";
import * as employeesService from "./employees.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

type EmployeeRow = Awaited<
  ReturnType<typeof employeesService.listEmployees>
>[number];

export const listEmployeesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await employeesService.listEmployees(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const exportEmployeesCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const employees = await employeesService.listEmployees(
      req.params.companyId,
      requireAuthContext(req),
    );
    const csv = buildCsv<EmployeeRow>(employees, [
      { header: "Matricule", value: (e) => e.code },
      { header: "Nom & prénom", value: (e) => e.fullName },
      { header: "Poste", value: (e) => e.position },
      { header: "Département", value: (e) => e.department },
      { header: "Type de poste", value: (e) => e.employmentType },
      { header: "Type de contrat", value: (e) => e.contractType },
      {
        header: "Date d'entrée",
        value: (e) => new Date(e.hireDate).toLocaleDateString("fr-FR"),
      },
      { header: "Salaire brut", value: (e) => Number(e.grossSalary) },
      { header: "Sexe", value: (e) => e.gender },
      { header: "Ville", value: (e) => e.city },
      { header: "Téléphone", value: (e) => e.phone },
      { header: "Email", value: (e) => e.email },
      { header: "Statut", value: (e) => e.status },
    ]);
    sendCsv(res, "personnel.csv", csv);
  },
);
export const createEmployeeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createEmployeeSchema.parse(req.body);
    res
      .status(201)
      .json(
        await employeesService.createEmployee(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const getEmployeeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await employeesService.getEmployee(
        req.params.id,
        requireAuthContext(req),
      ),
    );
  },
);
export const updateEmployeeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateEmployeeSchema.parse(req.body);
    res.json(
      await employeesService.updateEmployee(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteEmployeeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await employeesService.deleteEmployee(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

export const getOrgChartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await employeesService.getOrgChart(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const getLeaveBalanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { asOfDate } = req.query as { asOfDate?: string };
    res.json(
      await employeesService.getLeaveBalance(
        req.params.id,
        requireAuthContext(req),
        asOfDate ? new Date(asOfDate) : undefined,
      ),
    );
  },
);

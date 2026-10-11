import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { AppError } from "@/utils/AppError";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { renderContractPdf } from "./contract.render";

export async function streamContractPdf(
  employeeId: string,
  auth: AuthenticatedUser,
  res: Response,
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);

  const company = await prisma.company.findUnique({
    where: { id: employee.companyId },
    select: {
      name: true,
      currency: true,
      logoUrl: true,
      country: true,
      sector: true,
    },
  });
  if (!company) throw AppError.notFound("Entreprise introuvable");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="contrat-${employee.code}.pdf"`,
  );

  const pdf = new PDFDocument({ margin: 50, size: "A4" });
  pdf.pipe(res);

  renderContractPdf(pdf, {
    company,
    employee: {
      code: employee.code,
      fullName: employee.fullName,
      gender: employee.gender as "M" | "F",
      position: employee.position,
      department: employee.department,
      employmentType: employee.employmentType,
      contractType: employee.contractType,
      grossSalary: Number(employee.grossSalary),
      hireDate: employee.hireDate,
      city: employee.city,
      workLocation: employee.workLocation,
      weeklyHours: employee.weeklyHours ? Number(employee.weeklyHours) : null,
      trialPeriodMonths: employee.trialPeriodMonths,
      contractEndDate: employee.contractEndDate,
    },
  });

  pdf.end();
}

import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { AppError } from "@/utils/AppError";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { getPayslip } from "../payslip.service";
import { renderPayslipPdf } from "./payslip.render";

export async function streamPayslipPdf(
  employeeId: string,
  auth: AuthenticatedUser,
  periodDate: Date,
  res: Response,
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);
  const payslip = await getPayslip(employeeId, auth, periodDate);

  const company = await prisma.company.findUnique({
    where: { id: employee.companyId },
    select: { name: true, currency: true, logoUrl: true },
  });
  if (!company) throw AppError.notFound("Entreprise introuvable");

  const periodLabel = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="bulletin-${employee.code}-${periodLabel}.pdf"`,
  );

  const pdf = new PDFDocument({ margin: 50, size: "A4" });
  pdf.pipe(res);

  renderPayslipPdf(pdf, {
    company,
    employee: payslip.employee,
    period: payslip.period,
    hours: payslip.hours,
    payroll: payslip.payroll,
    paymentStatus: payslip.paymentStatus,
    paymentDate: payslip.paymentDate,
  });

  pdf.end();
}

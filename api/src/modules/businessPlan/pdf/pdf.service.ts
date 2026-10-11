import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import {
  assertCanModifyBusinessPlan,
  getOwnedBusinessPlanOrThrow,
} from "@/modules/businessPlan/plan/plan.service";
import { getBusinessPlanSummary } from "@/modules/businessPlan/summary/summary.service";
import { renderBusinessPlanPdf } from "./render";

/** Récupère les données et diffuse le PDF en réponse HTTP — le rendu lui-même
 * (mise en page, pagination) vit dans render.ts, pur et testable sans base. */
export async function streamBusinessPlanPdf(
  planId: string,
  auth: AuthenticatedUser,
  res: Response,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);

  const [
    company,
    investments,
    fundings,
    suppliers,
    cashflowLinesCount,
    summary,
  ] = await Promise.all([
    prisma.company.findUniqueOrThrow({
      where: { id: plan.companyId },
      select: { name: true, currency: true, logoUrl: true },
    }),
    prisma.businessPlanInvestment.findMany({
      where: { businessPlanId: planId },
    }),
    prisma.businessPlanFunding.findMany({ where: { businessPlanId: planId } }),
    prisma.businessPlanSupplier.findMany({ where: { businessPlanId: planId } }),
    prisma.businessPlanCashflowLine.count({
      where: { businessPlanId: planId },
    }),
    getBusinessPlanSummary(planId, auth),
  ]);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${plan.title.replace(/[^\w\- ]/g, "")}.pdf"`,
  );

  const pdf = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  pdf.pipe(res);

  renderBusinessPlanPdf(pdf, {
    plan: {
      title: plan.title,
      status: plan.status,
      horizonYears: plan.horizonYears,
      narrativeSections:
        (plan.narrativeSections as Record<string, string> | null) ?? null,
    },
    company,
    investments: investments.map((i: (typeof investments)[number]) => ({
      category: i.category,
      description: i.description,
      amount: Number(i.amount),
    })),
    fundings: fundings.map((f: (typeof fundings)[number]) => ({
      type: f.type,
      detail: f.detail,
      amount: Number(f.amount),
    })),
    suppliers: suppliers.map((s: (typeof suppliers)[number]) => ({
      name: s.name,
      supplyType: s.supplyType,
      annualAmount: Number(s.annualAmount),
    })),
    hasCashflowLines: cashflowLinesCount > 0,
    summary,
  });

  pdf.end();
}

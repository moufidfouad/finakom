import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { ListReportsQuery } from "./adminConversationReports.schemas";

const REPORT_INCLUDE = {
  reporterUser: { select: { fullName: true, email: true } },
  reporterCandidate: { select: { fullName: true } },
  conversation: {
    include: {
      participants: {
        include: {
          company: { select: { id: true, name: true } },
          candidate: { select: { id: true, fullName: true } },
        },
      },
    },
  },
} as const;

export async function listReports(query: ListReportsQuery) {
  const where =
    query.status === "all"
      ? {}
      : query.status === "resolved"
        ? { resolvedAt: { not: null } }
        : { resolvedAt: null };

  const [items, total] = await Promise.all([
    prisma.conversationReport.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.conversationReport.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/**
 * Contexte complet nécessaire pour évaluer un signalement — pas seulement le
 * motif, mais TOUS les messages échangés dans la conversation concernée,
 * pour que l'admin puisse juger en connaissance de cause plutôt que sur la
 * seule parole du plaignant.
 */
export async function getReportDetail(reportId: string) {
  const report = await prisma.conversationReport.findUnique({
    where: { id: reportId },
    include: REPORT_INCLUDE,
  });
  if (!report) throw AppError.notFound("Signalement introuvable");

  const messages = await prisma.message.findMany({
    where: { conversationId: report.conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      senderUser: { select: { fullName: true, email: true } },
      senderCandidate: { select: { fullName: true } },
    },
  });

  return { report, messages };
}

export async function resolveReport(reportId: string) {
  const report = await prisma.conversationReport.findUnique({
    where: { id: reportId },
  });
  if (!report) throw AppError.notFound("Signalement introuvable");
  return prisma.conversationReport.update({
    where: { id: reportId },
    data: { resolvedAt: new Date() },
  });
}

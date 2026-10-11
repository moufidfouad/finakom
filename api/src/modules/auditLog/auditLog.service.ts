import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface RecordAuditLogParams {
  companyId: string;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  summary: string;
}

/**
 * Enregistre une entrée du journal d'audit — best-effort, comme l'envoi
 * d'email ou la contre-passation automatique : une panne de journalisation ne
 * doit JAMAIS faire échouer l'opération métier d'origine (créer une facture ne
 * doit pas planter parce que l'audit trail est indisponible). L'appel se place
 * donc toujours APRÈS le succès de l'opération réelle dans les services
 * appelants, jamais avant ni en la conditionnant.
 */
export async function recordAuditLog(
  params: RecordAuditLogParams,
): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (err) {
    console.error(
      `⚠️  Échec de l'enregistrement du journal d'audit pour ${params.entityType}#${params.entityId} :`,
      err,
    );
  }
}

export async function listAuditLogs(
  companyId: string,
  auth: AuthenticatedUser,
  filters: { entityType?: string; entityId?: string; limit?: number } = {},
) {
  // Périmètre admin-tier : le journal d'audit expose des informations sensibles
  // (qui a modifié/supprimé quoi) — pas ouvert aux simples membres.
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.auditLog.findMany({
    where: {
      companyId,
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
    },
    include: { user: { select: { id: true, email: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: Math.min(filters.limit ?? 100, 500),
  });
}

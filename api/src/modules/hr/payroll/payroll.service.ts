import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { UpsertPayrollInput } from "./payroll.schemas";

export async function listPayroll(employeeId: string, auth: AuthenticatedUser) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.payroll.findMany({
    where: { employeeId },
    orderBy: { periodDate: "desc" },
  });
}
export async function upsertPayroll(
  employeeId: string,
  auth: AuthenticatedUser,
  input: UpsertPayrollInput,
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);
  const payroll = await prisma.payroll.upsert({
    where: {
      employeeId_periodDate: { employeeId, periodDate: input.periodDate },
    },
    create: { ...input, employeeId },
    update: input,
  });

  if (payroll.paymentStatus === "Payé") {
    await postPayrollEntryBestEffort(
      employee.companyId,
      payroll,
      employee.fullName,
      auth.userId,
    );
  }

  return payroll;
}

/**
 * Contre-passe automatiquement la charge de personnel (661 Charges de personnel
 * / 431 Organismes sociaux / 421 Personnel — rémunérations dues) quand un
 * bulletin passe au statut "Payé". Best-effort, mêmes principes que pour les
 * ventes et paiements côté facturation.
 *
 * Limite connue et assumée : `postAutoEntry` est idempotent par bulletin (une
 * seule écriture par `payroll.id`) — si un bulletin déjà marqué "Payé" est
 * ensuite corrigé (montant modifié) via un nouvel appel à `upsertPayroll`,
 * l'écriture déjà comptabilisée n'est PAS mise à jour automatiquement. Une
 * correction après paiement nécessite aujourd'hui une écriture manuelle de
 * régularisation (module Écritures) — un vrai mécanisme de contre-passation
 * d'annulation reste à construire dans une itération ultérieure.
 */
async function postPayrollEntryBestEffort(
  companyId: string,
  payroll: {
    id: string;
    periodDate: Date;
    grossSalary: unknown;
    bonus: unknown;
    latePenalty: unknown;
    socialContribution: unknown;
  },
  employeeFullName: string,
  createdById: string,
) {
  try {
    const { computePayroll } = await import("@/modules/hr/engine/hrEngine");
    const { buildPayrollEntryLines } =
      await import("@/modules/accounting/engine/postingEngine");
    const { postAutoEntry } =
      await import("@/modules/accounting/journalEntries/journalEntries.service");

    const calc = computePayroll({
      grossSalary: Number(payroll.grossSalary),
      bonus: Number(payroll.bonus),
      latePenalty: Number(payroll.latePenalty),
      socialContribution: Number(payroll.socialContribution),
    });

    const periodLabel = payroll.periodDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    await postAutoEntry({
      companyId,
      journal: "PAIE",
      date: payroll.periodDate,
      label: `Paie ${employeeFullName} — ${periodLabel}`,
      sourceType: "Payroll",
      sourceId: payroll.id,
      createdById,
      lines: buildPayrollEntryLines({
        totalGross: calc.totalGross,
        socialContribution: calc.socialContribution,
        netSalary: calc.netSalary,
      }),
    });
  } catch (err) {
    console.warn(
      `⚠️  Contre-passation comptable non effectuée pour la paie de ${employeeFullName} :`,
      err instanceof Error ? err.message : err,
    );
  }
}
export async function deletePayroll(id: string, auth: AuthenticatedUser) {
  const record = await prisma.payroll.findUnique({
    where: { id },
    include: { employee: { include: { company: true } } },
  });
  if (
    !record ||
    (!isSuperAdmin(auth.role) && record.employee.company.userId !== auth.userId)
  ) {
    throw AppError.notFound("Bulletin introuvable");
  }
  await prisma.payroll.delete({ where: { id } });
}

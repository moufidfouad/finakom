import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePayslip } from "./payslip.api";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";
import { apiClient } from "@/lib/axios";
import { formatDate } from "@/lib/format";

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${bold ? "font-medium" : ""}`}
    >
      <span className={accent ? "text-accent" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={`tabular ${accent ? "text-base text-accent" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function PayslipModal({
  employeeId,
  period,
  onClose,
}: {
  employeeId: string;
  period: string;
  onClose: () => void;
}) {
  const formatAmount = useFormatAmount();
  const {
    data: payslip,
    isLoading,
    isError,
    error,
  } = usePayslip(employeeId, period);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader className="flex-row items-center justify-between pr-6">
          <DialogTitle>Bulletin de paie</DialogTitle>
          {payslip && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  `${apiClient.defaults.baseURL}/employees/${employeeId}/pdf?period=${encodeURIComponent(period)}`,
                  "_blank",
                )
              }
            >
              <FileText className="h-4 w-4" /> Voir le PDF
            </Button>
          )}
        </DialogHeader>
        {isLoading && (
          <p className="text-sm text-muted-foreground">Calcul du bulletin…</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Impossible de générer le bulletin.")}
          </p>
        )}
        {payslip && (
          <div className="text-sm">
            <div className="border-b border-border pb-4">
              <p className="font-display text-lg font-medium">
                {payslip.employee.fullName}
              </p>
              <p className="text-muted-foreground">
                {payslip.employee.code} · {payslip.employee.position} ·{" "}
                {payslip.employee.department}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Période :{" "}
                {formatDate(payslip.period, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <Row
                label="Salaire de base"
                value={formatAmount(payslip.payroll.grossSalary)}
              />
              <Row label="Prime" value={formatAmount(payslip.payroll.bonus)} />
              <Row
                label={`Heures sup. (${Math.max(payslip.hours.overtimeHours, 0)}h × 1.25)`}
                value={formatAmount(payslip.payroll.overtimePay)}
              />
              <Row
                label="TOTAL BRUT"
                value={formatAmount(payslip.payroll.totalGross)}
                bold
              />
              <Row
                label="Retenue retard"
                value={`- ${formatAmount(payslip.payroll.latePenalty)}`}
              />
              <Row
                label="Cotisations sociales"
                value={`- ${formatAmount(payslip.payroll.socialContribution)}`}
              />
              <div className="mt-3 border-t border-border pt-3">
                <Row
                  label="NET À PAYER"
                  value={formatAmount(payslip.payroll.netSalary)}
                  bold
                  accent
                />
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>
                Heures contractuelles : {payslip.hours.contractualHours}h ·
                Heures réelles : {payslip.hours.actualHours}h
              </p>
              <p>
                Taux horaire :{" "}
                {formatAmount(Math.round(payslip.hours.hourlyRate))}/h
              </p>
              <p>Statut : {payslip.paymentStatus}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

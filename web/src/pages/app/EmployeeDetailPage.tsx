import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Pencil, Trash2 } from "lucide-react";
import {
  useDeleteEmployee,
  useEmployee,
  useEmployees,
  useUpdateEmployee,
} from "@/features/hr/employees.api";
import { useCompany } from "@/features/companies/companies.api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePublishCurrentCompany } from "@/hooks/usePublishCurrentCompany";
import EmployeeForm from "@/features/hr/EmployeeForm";
import AttendanceSection from "@/features/hr/AttendanceSection";
import LatenessSection from "@/features/hr/LatenessSection";
import WorkedHoursSection from "@/features/hr/WorkedHoursSection";
import PayrollSection from "@/features/hr/PayrollSection";
import LeaveSection from "@/features/hr/LeaveSection";
import ContractAmendmentsSection from "@/features/hr/ContractAmendmentsSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/lib/format";
import { apiClient } from "@/lib/axios";
import { EmployeeInput } from "@/types";
import { LoadingState } from "@/components/ui/loading-state";
import CurrencyProvider from "@/context/CurrencyContext";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(employeeId);
  const { data: colleagues } = useEmployees(employee?.companyId);
  const { data: company } = useCompany(employee?.companyId);
  usePublishCurrentCompany(
    company ? { id: company.id, name: company.name } : undefined,
  );

  const updateEmployee = useUpdateEmployee(employeeId as string);
  const deleteEmployee = useDeleteEmployee(employee?.companyId ?? "");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || !employee)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <LoadingState />
      </div>
    );

  const editValues: EmployeeInput = {
    fullName: employee.fullName,
    position: employee.position,
    department: employee.department,
    employmentType: employee.employmentType,
    grossSalary: Number(employee.grossSalary),
    hireDate: employee.hireDate.slice(0, 10),
    contractType: employee.contractType,
    gender: employee.gender,
    city: employee.city ?? undefined,
    phone: employee.phone ?? undefined,
    email: employee.email ?? undefined,
    status: employee.status,
    workLocation: employee.workLocation ?? undefined,
    weeklyHours: employee.weeklyHours
      ? Number(employee.weeklyHours)
      : undefined,
    trialPeriodMonths: employee.trialPeriodMonths ?? undefined,
    contractEndDate: employee.contractEndDate
      ? employee.contractEndDate.slice(0, 10)
      : undefined,
    managerId: employee.managerId ?? undefined,
  };
  // L'employé ne peut pas être son propre manager — exclu de la liste proposée
  // (le backend rejette de toute façon tout cycle hiérarchique, mais autant ne
  // pas le proposer trivialement dans le sélecteur).
  const eligibleManagers = (colleagues ?? []).filter(
    (c) => c.id !== employee.id,
  );

  return (
    <CurrencyProvider currency={company?.currency}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to={`/app/entreprises/${employee.companyId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour au personnel
        </Link>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {employee.code}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-medium text-foreground">
              {employee.fullName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.position} · {employee.department} ·{" "}
              {employee.contractType}
            </p>
            <p className="tabular mt-1 text-sm">
              {formatAmount(Number(employee.grossSalary), company?.currency)} /
              mois
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `${apiClient.defaults.baseURL}/employees/${employee.id}/contract/pdf`,
                  "_blank",
                )
              }
            >
              <FileText className="h-4 w-4" /> Imprimer le contrat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" /> Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Supprimer
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <AttendanceSection employeeId={employee.id} />
          <LatenessSection employeeId={employee.id} />
          <WorkedHoursSection employeeId={employee.id} />
          <PayrollSection employeeId={employee.id} />
          <LeaveSection employeeId={employee.id} />
          <ContractAmendmentsSection employeeId={employee.id} />
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'employé</DialogTitle>
            </DialogHeader>
            <EmployeeForm
              initialValues={editValues}
              managers={eligibleManagers}
              submitLabel="Enregistrer"
              onSubmit={async (values) => {
                await updateEmployee.mutateAsync(values);
                setEditOpen(false);
              }}
              onCancel={() => setEditOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Supprimer cet employé ?"
          description={
            <>
              Cette action supprimera définitivement{" "}
              <strong>{employee.fullName}</strong> ainsi que toutes ses données
              associées (présences, retards, heures, paies, congés).
              Irréversible.
            </>
          }
          confirmLabel="Confirmer la suppression"
          isLoading={deleteEmployee.isPending}
          onConfirm={async () => {
            await deleteEmployee.mutateAsync(employee.id);
            navigate(`/app/entreprises/${employee.companyId}`);
          }}
        />
      </div>
    </CurrencyProvider>
  );
}

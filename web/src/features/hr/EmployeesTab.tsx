import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Download, Network, List } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { EmployeeInput } from "@/types";
import { useCreateEmployee, useEmployees, useOrgChart } from "./employees.api";
import { useHrDashboard } from "./hrDashboard.api";
import EmployeeForm from "./EmployeeForm";
import OrgChartView from "./OrgChartView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

const statusVariant: Record<
  string,
  "success" | "secondary" | "accent" | "destructive"
> = {
  Actif: "success",
  Inactif: "secondary",
  Suspendu: "accent",
  Démissionné: "destructive",
};

export default function EmployeesTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const { data: employees, isLoading } = useEmployees(companyId);
  const { data: dashboard } = useHrDashboard(companyId);
  const { data: orgTree } = useOrgChart(companyId);
  const createEmployee = useCreateEmployee(companyId);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "orgchart">("list");

  const table = useDataTable(employees, {
    searchFields: (e) => [e.fullName, e.code, e.position, e.department],
    sortAccessors: {
      code: (e) => e.code,
      name: (e) => e.fullName,
      position: (e) => e.position,
      department: (e) => e.department,
      salary: (e) => Number(e.grossSalary),
      status: (e) => e.status,
    },
  });

  return (
    <div>
      {dashboard && dashboard.activeEmployeeCount > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border border-border bg-secondary/40 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Effectif actif</p>
            <p className="tabular font-medium">
              {dashboard.activeEmployeeCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Masse salariale brute
            </p>
            <p className="tabular font-medium">
              {formatAmount(dashboard.grossPayrollMass)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Retards ce mois</p>
            <p className="tabular font-medium">{dashboard.latenessCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Heures sup.</p>
            <p className="tabular font-medium">
              {dashboard.totalOvertimeHours}h
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {employees ? `${employees.length} employé(s)` : "Chargement…"}
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-3.5 w-3.5" /> Liste
            </button>
            <button
              type="button"
              onClick={() => setView("orgchart")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === "orgchart"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="h-3.5 w-3.5" /> Organigramme
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `${apiClient.defaults.baseURL}/companies/${companyId}/employees/export.csv`,
                "_blank",
              )
            }
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nouvel employé
          </Button>
        </div>
      </div>

      {view === "list" && employees && employees.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un employé…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {view === "orgchart" && orgTree && <OrgChartView tree={orgTree} />}

        {view === "list" && employees && employees.length === 0 && (
          <EmptyState
            icon={Users}
            message="Aucun employé pour cette entreprise."
          />
        )}

        {view === "list" &&
          employees &&
          employees.length > 0 &&
          table.totalCount === 0 && (
            <EmptyState
              icon={Users}
              message="Aucun employé ne correspond à cette recherche."
            />
          )}

        {view === "list" && employees && table.totalCount > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="code"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Code
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="name"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Nom
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="position"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="hidden sm:table-cell"
                  >
                    Poste
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="department"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="hidden md:table-cell"
                  >
                    Département
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="salary"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="text-right"
                  >
                    Salaire brut
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="status"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Statut
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">
                      {e.code}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/app/employes/${e.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {e.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {e.position}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {e.department}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatAmount(Number(e.grossSalary))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[e.status] ?? "secondary"}>
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            managers={employees ?? []}
            onSubmit={async (values: EmployeeInput) => {
              await createEmployee.mutateAsync(values);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

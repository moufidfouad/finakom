import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Employee, EmployeeInput, LeaveBalance, OrgNode } from "@/types";

export function useEmployees(companyId: string | undefined) {
  return useQuery({
    queryKey: ["employees", companyId],
    queryFn: async (): Promise<Employee[]> =>
      (await apiClient.get(`/companies/${companyId}/employees`)).data,
    enabled: !!companyId,
  });
}
export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async (): Promise<Employee> =>
      (await apiClient.get(`/employees/${id}`)).data,
    enabled: !!id,
  });
}
export function useCreateEmployee(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmployeeInput) =>
      (await apiClient.post(`/companies/${companyId}/employees`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      toast.success("Employé ajouté.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter l'employé.")),
  });
}
export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EmployeeInput>) =>
      (await apiClient.put(`/employees/${id}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employé mis à jour.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de modifier l'employé.")),
  });
}
export function useDeleteEmployee(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      toast.success("Employé supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer l'employé."),
      ),
  });
}

export function useOrgChart(companyId: string | undefined) {
  return useQuery({
    queryKey: ["org-chart", companyId],
    queryFn: async (): Promise<OrgNode[]> =>
      (await apiClient.get(`/companies/${companyId}/employees/org-chart`)).data,
    enabled: !!companyId,
  });
}

export function useLeaveBalance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["leave-balance", employeeId],
    queryFn: async (): Promise<LeaveBalance> =>
      (await apiClient.get(`/employees/${employeeId}/leave-balance`)).data,
    enabled: !!employeeId,
  });
}

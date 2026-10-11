import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  AttendanceInput,
  AttendanceRecord,
  LatenessInput,
  LatenessRecord,
  LeaveInput,
  LeaveRequestRecord,
  LeaveStatus,
  PayrollInput,
  PayrollRecord,
  WorkedHoursInput,
  WorkedHoursRecord,
} from "@/types";

// Présences
export function useAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", employeeId],
    queryFn: async (): Promise<AttendanceRecord[]> =>
      (await apiClient.get(`/employees/${employeeId}/attendance`)).data,
    enabled: !!employeeId,
  });
}
export function useCreateAttendance(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttendanceInput) =>
      (await apiClient.post(`/employees/${employeeId}/attendance`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", employeeId] });
      toast.success("Présence enregistrée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer la présence."),
      ),
  });
}
export function useDeleteAttendance(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      apiClient.delete(`/employees/${employeeId}/attendance/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", employeeId] });
      toast.success("Enregistrement supprimé.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// Retards
export function useLateness(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["lateness", employeeId],
    queryFn: async (): Promise<LatenessRecord[]> =>
      (await apiClient.get(`/employees/${employeeId}/lateness`)).data,
    enabled: !!employeeId,
  });
}
export function useCreateLateness(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LatenessInput) =>
      (await apiClient.post(`/employees/${employeeId}/lateness`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lateness", employeeId] });
      toast.success("Retard enregistré.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer le retard."),
      ),
  });
}
export function useDeleteLateness(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      apiClient.delete(`/employees/${employeeId}/lateness/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lateness", employeeId] });
      toast.success("Enregistrement supprimé.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// Heures travaillées
export function useWorkedHours(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["worked-hours", employeeId],
    queryFn: async (): Promise<WorkedHoursRecord[]> =>
      (await apiClient.get(`/employees/${employeeId}/worked-hours`)).data,
    enabled: !!employeeId,
  });
}
export function useUpsertWorkedHours(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WorkedHoursInput) =>
      (await apiClient.post(`/employees/${employeeId}/worked-hours`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worked-hours", employeeId] });
      toast.success("Heures enregistrées.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer les heures."),
      ),
  });
}
export function useDeleteWorkedHours(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      apiClient.delete(`/employees/${employeeId}/worked-hours/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worked-hours", employeeId] });
      toast.success("Enregistrement supprimé.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// Paie
export function usePayroll(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["payroll", employeeId],
    queryFn: async (): Promise<PayrollRecord[]> =>
      (await apiClient.get(`/employees/${employeeId}/payroll`)).data,
    enabled: !!employeeId,
  });
}
export function useUpsertPayroll(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PayrollInput) =>
      (await apiClient.post(`/employees/${employeeId}/payroll`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", employeeId] });
      toast.success("Paie enregistrée.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'enregistrer la paie.")),
  });
}
export function useDeletePayroll(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      apiClient.delete(`/employees/${employeeId}/payroll/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", employeeId] });
      toast.success("Bulletin supprimé.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// Congés
export function useLeaveRequests(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["leave", employeeId],
    queryFn: async (): Promise<LeaveRequestRecord[]> =>
      (await apiClient.get(`/employees/${employeeId}/leave`)).data,
    enabled: !!employeeId,
  });
}
export function useCreateLeaveRequest(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeaveInput) =>
      (await apiClient.post(`/employees/${employeeId}/leave`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave", employeeId] });
      toast.success("Demande de congé soumise.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de soumettre la demande."),
      ),
  });
}
export function useUpdateLeaveStatus(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      status,
    }: {
      recordId: string;
      status: LeaveStatus;
    }) =>
      (
        await apiClient.patch(
          `/employees/${employeeId}/leave/${recordId}/status`,
          { status },
        )
      ).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave", employeeId] });
      toast.success(
        variables.status === "Approuvé" ? "Congé approuvé." : "Congé refusé.",
      );
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
export function useDeleteLeaveRequest(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      apiClient.delete(`/employees/${employeeId}/leave/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave", employeeId] });
      toast.success("Demande supprimée.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

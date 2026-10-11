import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Payslip } from "@/types";

export function usePayslip(
  employeeId: string | undefined,
  period: string | undefined,
) {
  return useQuery({
    queryKey: ["payslip", employeeId, period],
    queryFn: async (): Promise<Payslip> =>
      (
        await apiClient.get(`/employees/${employeeId}/payslip`, {
          params: { period },
        })
      ).data,
    enabled: !!employeeId && !!period,
    retry: false,
  });
}

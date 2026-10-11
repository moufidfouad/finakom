import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export interface ContactInput {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: async (input: ContactInput) => {
      const { data } = await apiClient.post("/contact", input);
      return data;
    },
  });
}

import { useCurrentCompany } from "@/context/CurrentCompanyContext/context";
import { useEffect } from "react";

/**
 * Publie l'entreprise courante dans le contexte global
 */
export function usePublishCurrentCompany(
  company: { id: string; name: string } | undefined,
) {
  const { setCurrentCompany } = useCurrentCompany();

  useEffect(() => {
    if (company) setCurrentCompany(company);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, company?.name]);
}

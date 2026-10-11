import { useAuth } from "@/context/AuthContext/context";
import { useCompany } from "./companies.api";
import { useCompanyMembers } from "./members.api";

export function useCompanyPermissions(companyId: string | undefined) {
  const { user, isSuperAdmin } = useAuth();
  const { data: company } = useCompany(companyId);
  const { data: members } = useCompanyMembers(companyId);

  const isOwner = !!user && !!company && company.userId === user.id;
  const membership = members?.find((m) => m.user.id === user?.id);
  const isCompanyAdmin =
    isSuperAdmin || isOwner || membership?.role === "ADMIN";

  /** Créateur de la ressource (comparaison createdById), OU admin d'entreprise, OU superadmin. */
  function canModify(createdById: string | null | undefined): boolean {
    if (isSuperAdmin) return true;
    if (isCompanyAdmin) return true;
    return !!user && !!createdById && createdById === user.id;
  }

  return {
    isOwner,
    isCompanyAdmin,
    isSuperAdmin,
    canModify,
    currentUserId: user?.id,
  };
}

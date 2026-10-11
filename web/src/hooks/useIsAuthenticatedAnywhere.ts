import { useAuth } from "@/context/AuthContext/context";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";


/** Vrai si le visiteur est authentifié en tant qu'entreprise OU candidat  */
export function useIsAuthenticatedAnywhere(): boolean {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCandidateAuthenticated } = useCandidateAuth();
  return isAuthenticated || isCandidateAuthenticated;
}

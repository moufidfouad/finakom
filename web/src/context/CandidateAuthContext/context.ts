import { createContext, useContext } from "react";
import { CandidateAuthContextValue } from "./types";

export const CandidateAuthContext = createContext<
  CandidateAuthContextValue | undefined
>(undefined);

export function useCandidateAuth() {
  const ctx = useContext(CandidateAuthContext);
  if (!ctx)
    throw new Error(
      "useCandidateAuth doit être utilisé à l'intérieur de <CandidateAuthProvider>",
    );
  return ctx;
}

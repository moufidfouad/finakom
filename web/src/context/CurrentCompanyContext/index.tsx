import { ReactNode, useCallback, useState } from "react";
import { CurrentCompanyInfo } from "./types";
import { CurrentCompanyContext } from "./context";

export default function CurrentCompanyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [company, setCompany] = useState<CurrentCompanyInfo | null>(null);

  // useCallback pour une identité stable — évite de redéclencher les effets
  // des pages qui appellent setCurrentCompany(...) à chaque rendu.
  const setCurrentCompany = useCallback(
    (c: CurrentCompanyInfo | null) => setCompany(c),
    [],
  );

  return (
    <CurrentCompanyContext.Provider value={{ company, setCurrentCompany }}>
      {children}
    </CurrentCompanyContext.Provider>
  );
}

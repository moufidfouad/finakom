import { ReactNode } from "react";
import { CurrencyContext } from "./context";

export default function CurrencyProvider({
  currency,
  children,
}: {
  currency: string | undefined;
  children: ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={currency ?? "XOF"}>
      {children}
    </CurrencyContext.Provider>
  );
}

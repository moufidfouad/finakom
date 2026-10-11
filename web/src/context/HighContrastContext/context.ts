import { createContext, useContext } from "react";
import { HighContrastContextValue } from "./types";

export const HighContrastContext = createContext<
  HighContrastContextValue | undefined
>(undefined);
export function useHighContrast() {
  const ctx = useContext(HighContrastContext);
  if (!ctx)
    throw new Error(
      "useHighContrast doit être utilisé à l'intérieur de <HighContrastProvider>",
    );
  return ctx;
}

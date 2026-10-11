import { createContext, useContext } from "react";
import { ColorThemeContextValue } from "./types";

export const ColorThemeContext = createContext<
  ColorThemeContextValue | undefined
>(undefined);
export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx)
    throw new Error(
      "useColorTheme doit être utilisé à l'intérieur de <ColorThemeProvider>",
    );
  return ctx;
}

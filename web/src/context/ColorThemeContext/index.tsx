import { ReactNode, useEffect, useState } from "react";
import { COLOR_THEMES } from "./constants";
import { ColorThemeContext } from "./context";

const DEFAULT_COLOR_THEME = "finakom";
const STORAGE_KEY = "finakom_color_theme";

function readStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_COLOR_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && COLOR_THEMES.some((t) => t.value === stored)
    ? stored
    : DEFAULT_COLOR_THEME;
}

/**
 * Gère la PALETTE de couleurs (FINAKOM, Émeraude, Saphir...)
 */
export default function ColorThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [colorTheme, setColorThemeState] =
    useState<string>(DEFAULT_COLOR_THEME);

  useEffect(() => {
    setColorThemeState(readStoredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-color-theme", colorTheme);
  }, [colorTheme]);

  function setColorTheme(value: string) {
    setColorThemeState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <ColorThemeContext.Provider
      value={{ colorTheme, setColorTheme, colorThemes: COLOR_THEMES }}
    >
      {children}
    </ColorThemeContext.Provider>
  );
}

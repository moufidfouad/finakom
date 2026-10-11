import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Gère le thème clair/sombre (classe `dark` sur <html>, persistance localStorage,
 * respect de la préférence système par défaut). Les variables CSS correspondantes
 * (`:root` / `.dark`) sont déjà définies dans src/index.css.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

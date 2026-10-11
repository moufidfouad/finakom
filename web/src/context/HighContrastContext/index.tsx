import { ReactNode, useEffect, useState } from "react";
import { HighContrastContext } from "./context";

const STORAGE_KEY = "finakom_high_contrast";

function readStored(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true; // Par défaut, contraste élevé activé pour l'accessibilité
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

/**
 * Contraste élevé 
 */
export default function HighContrastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [highContrast, setHighContrastState] = useState<boolean>(true);

  useEffect(() => {
    setHighContrastState(readStored());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  function setHighContrast(value: boolean) {
    setHighContrastState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }

  return (
    <HighContrastContext.Provider value={{ highContrast, setHighContrast }}>
      {children}
    </HighContrastContext.Provider>
  );
}

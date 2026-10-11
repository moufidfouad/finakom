import { useEffect, useState } from "react";

/** Retarde la propagation d'une valeur qui change vite (ex: frappe dans un
 * champ de recherche) — évite un appel réseau à chaque caractère tapé. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

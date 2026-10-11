import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

/** Toaster global, stylé avec les variables CSS du thème (clair/sombre) déjà en place. */
export default function AppToaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      theme={theme === "dark" ? "dark" : theme === "light" ? "light" : "system"}
      closeButton
      richColors
      toastOptions={{
        duration: 4000,
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius-lg)",
          fontSize: "13px",
        },
      }}
    />
  );
}

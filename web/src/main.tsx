import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import App from "./App";
import "./index.css";
import ThemeProvider from "./context/ThemeContext";
import ColorThemeProvider from "./context/ColorThemeContext";
import AuthProvider from "./context/AuthContext";
import AppToaster from "./components/theme/AppToaster";
import HighContrastProvider from "./context/HighContrastContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ColorThemeProvider>
        <HighContrastProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
              <AppToaster />
            </AuthProvider>
          </QueryClientProvider>
        </HighContrastProvider>
      </ColorThemeProvider>
    </ThemeProvider>
  </StrictMode>,
);

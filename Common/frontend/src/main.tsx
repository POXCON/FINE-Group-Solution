import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { ThemeProvider } from "@/shared/lib/theme/ThemeContext";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { msalInstance } from "@/features/auth/api/msalInstance";
import { queryClient } from "@/shared/lib/queryClient";
import "@/shared/lib/i18n/index";
import "@/index.css";
import { App } from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Entra 構成時のみ MsalProvider でラップする（未設定時はモック認証で動作）。
function withMsal(children: ReactNode): React.JSX.Element {
  if (msalInstance) {
    return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
  }
  return <>{children}</>;
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {withMsal(
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>,
        )}
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

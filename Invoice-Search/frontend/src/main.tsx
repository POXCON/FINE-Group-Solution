import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { ThemeProvider } from "@/shared/lib/theme/ThemeContext";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { getMsalInstance } from "@/features/auth/api/authClient";
import { queryClient } from "@/shared/lib/queryClient";
import "@/shared/lib/i18n/index";
import "@/index.css";
import { App } from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

/**
 * MSAL が構成済みなら `MsalProvider` で全体をラップする。
 * モック認証モード（env 未設定）では MsalProvider を用いず、カスタム
 * `AuthProvider` のみで動作させる（dev / E2E フォールバック）。
 */
function renderTree(instance: IPublicClientApplication | null): ReactNode {
  const tree = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter basename="/invoice-search">
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  return instance ? <MsalProvider instance={instance}>{tree}</MsalProvider> : tree;
}

/**
 * MSAL は利用前に `initialize()` と `handleRedirectPromise()` の完了が必須（v3+）。
 * これらを解決してからレンダリングし、保持済みアカウントをアクティブ化する。
 */
async function bootstrap(root: HTMLElement): Promise<void> {
  const instance = getMsalInstance();
  if (instance) {
    await instance.initialize();
    await instance.handleRedirectPromise();
    const accounts = instance.getAllAccounts();
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0]);
    }
  }
  createRoot(root).render(<StrictMode>{renderTree(instance)}</StrictMode>);
}

void bootstrap(rootElement);

import { PublicClientApplication, type IPublicClientApplication } from "@azure/msal-browser";
import { createMsalAuthClient } from "./msalAuthClient";
import { createMockAuthClient } from "./mockAuthClient";
import { buildMsalConfig, isMsalConfigured } from "../lib/msalConfig";
import type { AuthClient } from "../types";

/**
 * Entra ID（MSAL）未設定時はモック認証へフォールバックする。
 * ローカル開発・Vitest・Playwright（E2E）は env 未設定のためモックで動作する。
 */
export const isMockAuthMode = (): boolean => !isMsalConfigured();

/** MSAL インスタンスのシングルトン（設定済みのときのみ生成）。 */
let msalInstance: IPublicClientApplication | null = null;

/**
 * `MsalProvider` へ渡す／初期化するための MSAL インスタンスを返す。
 * モック認証モードでは null（MsalProvider を用いない）。
 */
export function getMsalInstance(): IPublicClientApplication | null {
  if (!isMsalConfigured()) {
    return null;
  }
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(buildMsalConfig());
  }
  return msalInstance;
}

function buildAuthClient(): AuthClient {
  const instance = getMsalInstance();
  if (instance) {
    return createMsalAuthClient(instance);
  }
  return createMockAuthClient();
}

export const authClient: AuthClient = buildAuthClient();

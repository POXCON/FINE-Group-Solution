import { createMsalAuthClient } from "./msalAuthClient";
import { createMockAuthClient } from "./mockAuthClient";
import { msalInstance } from "./msalInstance";
import { readEntraEnv } from "../lib/msalConfig";
import { readPreference } from "../lib/authStorage";
import type { AuthClient } from "../types";

function buildAuthClient(): AuthClient {
  const env = readEntraEnv();
  if (msalInstance && env) {
    return createMsalAuthClient({
      instance: msalInstance,
      env,
      initialKind: readPreference(),
    });
  }
  // Entra 未設定（ローカル／テスト）時はモック認証へフォールバック。
  return createMockAuthClient();
}

export const isMockAuthMode = (): boolean => msalInstance === null;

export const authClient: AuthClient = buildAuthClient();

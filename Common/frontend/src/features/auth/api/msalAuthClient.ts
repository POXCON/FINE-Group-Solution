import type { AccountInfo, PublicClientApplication } from "@azure/msal-browser";
import type { AuthClient, AuthUser, LoginOptions } from "../types";
import { normalizeRoles } from "../lib/roles";
import { loginRequestFor, type EntraEnv } from "../lib/msalConfig";
import {
  persistPreference,
  storageKindFor,
  type StorageKind,
} from "../lib/authStorage";
import { createMsalInstance } from "./msalInstance";

interface IdTokenClaims {
  roles?: unknown;
  name?: unknown;
}

/** MSAL アカウント → アプリの AuthUser（roles クレームでロール判定）。 */
function userFromAccount(account: AccountInfo): AuthUser {
  const claims = account.idTokenClaims as IdTokenClaims | undefined;
  const name = typeof claims?.name === "string" ? claims.name : account.name;
  return {
    email: account.username,
    name,
    roles: normalizeRoles(claims?.roles),
  };
}

export interface MsalAuthClientDeps {
  instance: PublicClientApplication;
  env: EntraEnv;
  /** 生成時の cacheLocation に対応する StorageKind。 */
  initialKind: StorageKind;
  /** cacheLocation 切替時の再生成ファクトリ（テスト差し替え用）。 */
  createInstance?: (env: EntraEnv, kind: StorageKind) => PublicClientApplication;
}

/**
 * Microsoft Entra ID (MSAL) 認証クライアント。
 *
 * - login  : 記憶トグルで cacheLocation を確定 → 必要なら PCA を再生成 → loginRedirect。
 * - logout : logoutRedirect。
 * - getCurrentUser : リダイレクト応答を処理し、アクティブアカウントを AuthUser へ写像。
 * - getToken : acquireTokenSilent でアクセストークンを取得（失敗時は null）。
 */
export function createMsalAuthClient({
  instance,
  env,
  initialKind,
  createInstance = createMsalInstance,
}: MsalAuthClientDeps): AuthClient {
  let pca = instance;
  let currentKind = initialKind;
  let initPromise: Promise<void> | null = null;

  const ensureReady = (): Promise<void> => {
    if (!initPromise) {
      initPromise = pca.initialize().then(async () => {
        const result = await pca.handleRedirectPromise();
        if (result?.account) {
          pca.setActiveAccount(result.account);
        }
      });
    }
    return initPromise;
  };

  const resolveAccount = (): AccountInfo | null =>
    pca.getActiveAccount() ?? pca.getAllAccounts()[0] ?? null;

  const login = async ({ rememberMe }: LoginOptions): Promise<AuthUser> => {
    const kind = storageKindFor(rememberMe);
    persistPreference(kind);
    if (kind !== currentKind) {
      // cacheLocation は構築後に変更できないため PCA を再生成する。
      pca = createInstance(env, kind);
      currentKind = kind;
      initPromise = null;
    }
    await ensureReady();
    await pca.loginRedirect(loginRequestFor(env));
    // リダイレクトでページ遷移するため、以降は実行されない（型充足のため保留）。
    return new Promise<AuthUser>(() => undefined);
  };

  const logout = async (): Promise<void> => {
    await ensureReady();
    await pca.logoutRedirect({ account: resolveAccount() ?? undefined });
  };

  const getCurrentUser = async (): Promise<AuthUser | null> => {
    await ensureReady();
    const account = resolveAccount();
    if (!account) {
      return null;
    }
    pca.setActiveAccount(account);
    return userFromAccount(account);
  };

  const getToken = async (): Promise<string | null> => {
    await ensureReady();
    const account = resolveAccount();
    if (!account) {
      return null;
    }
    try {
      const result = await pca.acquireTokenSilent({
        scopes: [env.apiScope],
        account,
      });
      return result.accessToken;
    } catch {
      // サイレント取得失敗（要対話）は null を返し、呼び出し側／API 側で処理する。
      return null;
    }
  };

  return { login, logout, getCurrentUser, getToken };
}

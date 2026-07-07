import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import type { AuthClient, AuthUser } from "../types";
import { clearPreference } from "../lib/authStorage";
import { getApiScope, getLoginRequest } from "../lib/msalConfig";
import { normalizeRoles } from "../lib/roles";

interface EntraIdTokenClaims {
  name?: unknown;
  preferred_username?: unknown;
  roles?: unknown;
  email?: unknown;
}

/** アクティブアカウント（無ければ最初のアカウント）を取得する。 */
function resolveAccount(instance: IPublicClientApplication): AccountInfo | null {
  return instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
}

/** MSAL の AccountInfo を AuthUser へ写像する。roles / name / email を安全に抽出。 */
function accountToUser(account: AccountInfo): AuthUser {
  const claims = (account.idTokenClaims ?? {}) as EntraIdTokenClaims;
  const roles = normalizeRoles(claims.roles);
  const claimName = typeof claims.name === "string" ? claims.name : undefined;
  const claimEmail =
    typeof claims.preferred_username === "string"
      ? claims.preferred_username
      : typeof claims.email === "string"
        ? claims.email
        : undefined;

  return {
    email: account.username || claimEmail || "",
    name: account.name ?? claimName,
    roles,
  };
}

/**
 * Microsoft Entra ID（MSAL）ベースの認証クライアント。
 *
 * ポータル（Common）が同一 clientId・同一オリジンで確立した MSAL キャッシュを
 * 共有し、Invoice-Search 側は保持済みアカウントの `roles` クレームで管理者判定を行う。
 * 未認証（アカウント無し）の場合は null を返し、ProtectedRoute がポータル（`/`）へ
 * リダイレクトして SSO ログインへ委譲する（現行の SSO 動線を踏襲）。
 */
export function createMsalAuthClient(
  instance: IPublicClientApplication,
  apiScope: string = getApiScope(),
): AuthClient {
  const login = async (): Promise<AuthUser> => {
    const result = await instance.ssoSilent(getLoginRequest());
    instance.setActiveAccount(result.account);
    return accountToUser(result.account);
  };

  // ログアウトはポータルの責務（本アプリに UI は無い）。共有 Entra セッションや
  // MSAL キャッシュを破壊しないよう、ローカルの状態のみをクリアする。
  const logout = async (): Promise<void> => {
    clearPreference();
    instance.setActiveAccount(null);
    return Promise.resolve();
  };

  const getCurrentUser = async (): Promise<AuthUser | null> => {
    const account = resolveAccount(instance);
    return account ? accountToUser(account) : null;
  };

  const getToken = async (): Promise<string | null> => {
    const account = resolveAccount(instance);
    if (!account) {
      return null;
    }
    try {
      const result = await instance.acquireTokenSilent({
        scopes: apiScope ? [apiScope] : [],
        account,
      });
      return result.accessToken || null;
    } catch {
      // InteractionRequiredAuthError 等でサイレント取得不可。API 呼び出し側で
      // 401 を扱えるよう null を返す（Bearer を付与しない）。
      return null;
    }
  };

  return { login, logout, getCurrentUser, getToken };
}

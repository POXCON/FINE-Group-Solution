import type { AuthClient, AuthUser, LoginCredentials } from "../types";
import { ADMIN_ROLE, normalizeRoles } from "../lib/roles";

const SESSION_STORAGE_KEY = "invoice-search.mock-auth-user";
const MIN_PASSWORD_LENGTH = 8;

/**
 * dev / E2E では Entra ID が無いため、モックユーザーは管理者（`admin` ロール保持）
 * として扱い、Invoice-Search のロールガードを通す。
 */
const MOCK_ROLES: readonly string[] = [ADMIN_ROLE];

function readStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser> & { roles?: unknown };
    if (typeof parsed.email !== "string") {
      return null;
    }
    return {
      email: parsed.email,
      name: parsed.name,
      // 旧形式（roles 無し）も管理者として復元し、後方互換を保つ。
      roles: parsed.roles === undefined ? MOCK_ROLES : normalizeRoles(parsed.roles),
    };
  } catch {
    return null;
  }
}

/**
 * Entra ID が未設定のとき（ローカル開発・E2E など）に用いるモック認証。
 * 構文的に妥当なメールと 8 文字以上のパスワードを受理する。
 */
export function createMockAuthClient(): AuthClient {
  const login = ({ email, password }: LoginCredentials): Promise<AuthUser> => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail || password.length < MIN_PASSWORD_LENGTH) {
      return Promise.reject(new Error("Invalid email or password."));
    }
    const user: AuthUser = { email, roles: MOCK_ROLES };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return Promise.resolve(user);
  };

  const logout = (): Promise<void> => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return Promise.resolve();
  };

  const getCurrentUser = (): Promise<AuthUser | null> => Promise.resolve(readStoredUser());

  // モック認証ではトークンを発行しない（バックエンドは AUTH_DISABLED 前提）。
  const getToken = (): Promise<string | null> => Promise.resolve(null);

  return { login, logout, getCurrentUser, getToken };
}

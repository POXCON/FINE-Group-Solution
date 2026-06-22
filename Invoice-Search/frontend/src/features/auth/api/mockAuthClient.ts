import type { AuthClient, AuthUser, LoginCredentials } from "../types";
import { ADMIN_GROUP, normalizeGroups } from "../lib/roles";

const SESSION_STORAGE_KEY = "invoice-search.mock-auth-user";
const MIN_PASSWORD_LENGTH = 8;

/**
 * dev / E2E では Cognito が無いため、モックユーザーは管理者
 * （fine-admin 所属）として扱い、Invoice-Search のロールガードを通す。
 */
const MOCK_GROUPS: readonly string[] = [ADMIN_GROUP];

function readStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser> & { groups?: unknown };
    if (typeof parsed.email !== "string") {
      return null;
    }
    return {
      email: parsed.email,
      name: parsed.name,
      // 旧形式（groups 無し）も管理者として復元し、後方互換を保つ。
      groups: parsed.groups === undefined ? MOCK_GROUPS : normalizeGroups(parsed.groups),
    };
  } catch {
    return null;
  }
}

/**
 * Mock authentication used when Cognito is not configured (e.g. local
 * development before the AWS infrastructure exists). Accepts any
 * syntactically valid email and a password of at least 8 characters.
 */
export function createMockAuthClient(): AuthClient {
  const login = ({ email, password }: LoginCredentials): Promise<AuthUser> => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail || password.length < MIN_PASSWORD_LENGTH) {
      return Promise.reject(new Error("Invalid email or password."));
    }
    const user: AuthUser = { email, groups: MOCK_GROUPS };
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

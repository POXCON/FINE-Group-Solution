import type { AuthClient, AuthUser, LoginCredentials } from "../types";

const SESSION_STORAGE_KEY = "invoice-search.mock-auth-user";
const MIN_PASSWORD_LENGTH = 8;

function readStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
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
    const user: AuthUser = { email };
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

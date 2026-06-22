import type { AuthClient, AuthUser, LoginCredentials } from "../types";
import { ADMIN_GROUP } from "../lib/roles";
import {
  persistPreference,
  readPreference,
  resolveStorage,
  storageKindFor,
} from "../lib/authStorage";

const STORAGE_KEY = "fine-portal.mock-auth-user";
const MIN_PASSWORD_LENGTH = 8;

function readStoredUser(): AuthUser | null {
  const storage = resolveStorage(readPreference());
  const raw = storage.getItem(STORAGE_KEY);
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
 * モック認証。Cognito 未設定（ローカル開発など）時に使用する。
 * 構文上正しいメールと 8 文字以上のパスワードでサインインできる。
 *
 * ロール確認用: メールのローカル部に "admin" を含む場合は `fine-admin` グループを
 * 付与し、管理者カードを確認できるようにする（モック専用の便宜的挙動）。
 *
 * 記憶トグルも尊重する: rememberMe=ON は localStorage、OFF は sessionStorage に保存。
 */
export function createMockAuthClient(): AuthClient {
  const login = ({
    email,
    password,
    rememberMe,
  }: LoginCredentials): Promise<AuthUser> => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail || password.length < MIN_PASSWORD_LENGTH) {
      return Promise.reject(new Error("Invalid email or password."));
    }
    const localPart = email.split("@")[0] ?? "";
    const groups = localPart.toLowerCase().includes("admin") ? [ADMIN_GROUP] : [];
    const user: AuthUser = { email, groups };

    const kind = storageKindFor(rememberMe);
    persistPreference(kind);
    resolveStorage(kind).setItem(STORAGE_KEY, JSON.stringify(user));
    return Promise.resolve(user);
  };

  const logout = (): Promise<void> => {
    // 両ストレージから確実に除去する。
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  };

  const getCurrentUser = (): Promise<AuthUser | null> =>
    Promise.resolve(readStoredUser());

  // モック認証ではトークンを発行しない（バックエンドは AUTH_DISABLED 前提）。
  const getToken = (): Promise<string | null> => Promise.resolve(null);

  return { login, logout, getCurrentUser, getToken };
}

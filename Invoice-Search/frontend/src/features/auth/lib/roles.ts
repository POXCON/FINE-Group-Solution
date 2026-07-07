import type { AuthUser } from "../types";

/**
 * 管理者を表す Entra ID App Role の値。Invoice-Search は管理者専用。
 * Cognito の `fine-admin` グループから Entra の素の `admin` ロールへ移行。
 */
export const ADMIN_ROLE = "admin";

/**
 * トークンの `roles` クレームを正規化する。
 * 文字列配列以外（未定義・単一文字列・不正値）にも頑健に対応する。
 */
export function normalizeRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string");
  }
  if (typeof raw === "string" && raw.length > 0) {
    return [raw];
  }
  return [];
}

/** ユーザーが管理者（`admin` ロール保持）かどうか。 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  return user.roles.includes(ADMIN_ROLE);
}

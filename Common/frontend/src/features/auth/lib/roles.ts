import type { AuthUser } from "../types";

/** Entra App Roles の値（`fine-` プレフィックスは付けない素の値）。 */
export const ROLE_ADMIN = "admin";
export const ROLE_STORE = "store";
export const ROLE_MANAGER = "manager";

/**
 * ID トークンの `roles` クレームを正規化する。
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

/** ユーザーが管理者（`admin` ロールを保持）かどうか。 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  return user.roles.includes(ROLE_ADMIN);
}

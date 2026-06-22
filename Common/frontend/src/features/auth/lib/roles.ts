import type { AuthUser } from "../types";

/** 管理者を表す Cognito グループ名。 */
export const ADMIN_GROUP = "fine-admin";

/**
 * ID トークンの cognito:groups を正規化する。
 * 文字列配列以外（未定義・単一文字列・不正値）にも頑健に対応する。
 */
export function normalizeGroups(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string");
  }
  if (typeof raw === "string" && raw.length > 0) {
    return [raw];
  }
  return [];
}

/** ユーザーが管理者（fine-admin 所属）かどうか。 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  return user.groups.includes(ADMIN_GROUP);
}

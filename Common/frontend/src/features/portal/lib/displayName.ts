import type { AuthUser } from "@/features/auth/types";

/**
 * 表示名を解決する。
 * ID トークンの `name` を優先し、無ければメールアドレスの "@" より前を使う。
 */
export function displayName(user: AuthUser | null): string {
  if (!user) {
    return "";
  }
  if (user.name && user.name.trim().length > 0) {
    return user.name;
  }
  const localPart = user.email.split("@")[0];
  return localPart ?? user.email;
}

/**
 * MSAL キャッシュ共有（SSO）のためのストレージ選択ロジック。
 *
 * ポータル（Common）がログイン時に選んだ「ログイン情報を記憶する」設定を
 * `fine-portal.remember`（localStorage）に保持しており、Invoice-Search は
 * 同一 clientId・同一オリジンのため、MSAL の `cacheLocation` を同じストレージに
 * 合わせればポータルが確立したアカウント／トークンを共有できる。
 *
 * - "local"   : localStorage（永続。ブラウザを閉じても保持）
 * - "session" : sessionStorage（ブラウザ／タブを閉じると消去）
 *
 * ポータル側の `authStorage` と同じキー・同じ既定値（未設定/不正値は "session"）
 * を厳守すること。差異があると SSO が成立しない。
 */

export type StorageKind = "local" | "session";

/** ポータルと共有する preference キー。変更厳禁。 */
const PREFERENCE_KEY = "fine-portal.remember";

/** preference 値 → 実際の Storage 実装。 */
export function resolveStorage(kind: StorageKind): Storage {
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

/** 保存済み preference を読み出す。未設定/不正値は "session"（記憶しない）。 */
export function readPreference(): StorageKind {
  try {
    const stored = window.localStorage.getItem(PREFERENCE_KEY);
    return stored === "local" ? "local" : "session";
  } catch {
    return "session";
  }
}

/** preference を消去する（ログアウト時など）。 */
export function clearPreference(): void {
  try {
    window.localStorage.removeItem(PREFERENCE_KEY);
  } catch {
    /* localStorage 不可環境では no-op（致命的ではない） */
  }
}

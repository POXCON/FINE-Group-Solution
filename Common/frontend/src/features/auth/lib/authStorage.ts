/**
 * 「ログイン情報を記憶する」トグルのストレージ選択ロジック。
 *
 * - ON  : localStorage（永続。ブラウザを閉じても保持）
 * - OFF : sessionStorage（ブラウザ／タブを閉じると消去）
 *
 * Cognito は `CognitoUserPool({ Storage })` で渡されたストレージにトークンを保存する。
 * ログイン時に選択したストレージで pool を再構築し、`getCurrentUser` / `getToken` も
 * 同じストレージ選択を尊重する必要がある。そのため preference 自体は localStorage に
 * 保持し、アプリ初期化時にも同じストレージを再現できるようにする。
 */

export type StorageKind = "local" | "session";

const PREFERENCE_KEY = "fine-portal.remember";

/** preference 値 → 実際の Storage 実装。 */
export function resolveStorage(kind: StorageKind): Storage {
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

/** rememberMe トグル → StorageKind。 */
export function storageKindFor(rememberMe: boolean): StorageKind {
  return rememberMe ? "local" : "session";
}

/** 選択した preference を永続化する（次回起動時の復元用）。 */
export function persistPreference(kind: StorageKind): void {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, kind);
  } catch {
    /* localStorage 不可環境では preference 永続化を諦める（致命的ではない） */
  }
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
    /* no-op */
  }
}

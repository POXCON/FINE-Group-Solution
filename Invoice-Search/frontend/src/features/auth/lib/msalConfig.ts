import type { Configuration } from "@azure/msal-browser";
import { readPreference } from "./authStorage";

/** Invoice-Search を配信するサブパス。SPA リダイレクト URI の基準にする。 */
const SUBPATH = "/invoice-search/";

/** ログイン／トークン取得で要求する既定スコープ（openid/profile は暗黙付与）。 */
const BASE_SCOPES = ["openid", "profile"] as const;

/**
 * Entra ID（MSAL）が設定済みかどうか。clientId と authority が両方
 * 揃っている場合のみ MSAL を用い、未設定時はモック認証へフォールバックする。
 */
export function isMsalConfigured(): boolean {
  return Boolean(import.meta.env.VITE_AZURE_CLIENT_ID && import.meta.env.VITE_AZURE_AUTHORITY);
}

/** バックエンド API 用スコープ（`access_as_user`）。未設定時は空文字。 */
export function getApiScope(): string {
  return import.meta.env.VITE_AZURE_API_SCOPE ?? "";
}

/** 対話ログイン／SSO サイレントで要求するスコープ集合。 */
export function getLoginRequest(): { scopes: string[] } {
  const apiScope = getApiScope();
  const scopes = apiScope ? [...BASE_SCOPES, apiScope] : [...BASE_SCOPES];
  return { scopes };
}

/** アクセストークン取得で要求するスコープ集合（API スコープのみ）。 */
export function getTokenRequest(): { scopes: string[] } {
  const apiScope = getApiScope();
  return { scopes: apiScope ? [apiScope] : [] };
}

/** SPA のリダイレクト URI（サブパス直下）。SSR 非対応環境でも安全に組み立てる。 */
function buildRedirectUri(): string {
  if (typeof window === "undefined") {
    return SUBPATH;
  }
  return `${window.location.origin}${SUBPATH}`;
}

/**
 * MSAL `PublicClientApplication` 用の構成を env から生成する。
 *
 * `cacheLocation` はポータルと共有する「記憶する」設定（`fine-portal.remember`）
 * に従い localStorage / sessionStorage を切り替える（Common(#72) と同方針）。
 * 同一 clientId・同一オリジンのため、ポータルが確立した MSAL キャッシュを共有し
 * SSO を成立させる。
 */
export function buildMsalConfig(): Configuration {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID ?? "";
  const authority = import.meta.env.VITE_AZURE_AUTHORITY ?? "";
  const remembered = readPreference() === "local";

  return {
    auth: {
      clientId,
      authority,
      redirectUri: buildRedirectUri(),
      postLogoutRedirectUri: "/",
    },
    cache: {
      // ポータルの「記憶する」設定に合わせて MSAL キャッシュ保存先を切り替える。
      cacheLocation: remembered ? "localStorage" : "sessionStorage",
    },
  };
}

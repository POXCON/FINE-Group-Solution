import type {
  BrowserCacheLocation,
  Configuration,
  RedirectRequest,
} from "@azure/msal-browser";
import type { StorageKind } from "./authStorage";

/**
 * Microsoft Entra ID (MSAL) の構成を env から組み立てる。
 *
 * 「ログイン情報を記憶する」トグルに応じて `cache.cacheLocation` を切り替える:
 * - local   → localStorage（永続。ブラウザを閉じても保持）
 * - session → sessionStorage（ブラウザ／タブを閉じると消去）
 *
 * cacheLocation は PCA 構築後に変更できないため、切替時は PCA を再生成する
 * （`msalInstance` / `msalAuthClient` を参照）。
 */

export interface EntraEnv {
  clientId: string;
  authority: string;
  apiScope: string;
}

/** env から Entra 設定を読み出す。未設定の必須値があれば null。 */
export function readEntraEnv(): EntraEnv | null {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
  const authority = import.meta.env.VITE_AZURE_AUTHORITY;
  const apiScope = import.meta.env.VITE_AZURE_API_SCOPE;

  if (!clientId || !authority || !apiScope) {
    return null;
  }
  return { clientId, authority, apiScope };
}

/** StorageKind を MSAL の cacheLocation へ写像する。 */
export function cacheLocationFor(kind: StorageKind): BrowserCacheLocation {
  return kind === "local"
    ? ("localStorage" as BrowserCacheLocation)
    : ("sessionStorage" as BrowserCacheLocation);
}

/** MSAL の Configuration を組み立てる。 */
export function buildMsalConfiguration(
  env: EntraEnv,
  kind: StorageKind,
): Configuration {
  return {
    auth: {
      clientId: env.clientId,
      authority: env.authority,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      // トークン／アカウント保存先。記憶トグルに応じて local/session を切り替える。
      cacheLocation: cacheLocationFor(kind),
    },
  };
}

/** ログイン／トークン取得時に要求するスコープ。 */
export function loginRequestFor(env: EntraEnv): RedirectRequest {
  return { scopes: [env.apiScope] };
}

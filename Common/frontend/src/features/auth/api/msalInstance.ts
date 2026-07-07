import { PublicClientApplication } from "@azure/msal-browser";
import {
  buildMsalConfiguration,
  readEntraEnv,
  type EntraEnv,
} from "../lib/msalConfig";
import { readPreference, type StorageKind } from "../lib/authStorage";

/**
 * MSAL の `PublicClientApplication` を、選択された cacheLocation で生成する。
 * cacheLocation は構築後に変更できないため、記憶トグル切替時は本関数で再生成する。
 */
export function createMsalInstance(
  env: EntraEnv,
  kind: StorageKind,
): PublicClientApplication {
  return new PublicClientApplication(buildMsalConfiguration(env, kind));
}

/**
 * アプリ全体で共有する PCA シングルトン。
 * Entra 未設定（ローカル／テスト）時は null となり、モック認証へフォールバックする。
 * 生成時は保存済み preference の cacheLocation を再現する。
 */
const entraEnv = readEntraEnv();

export const msalInstance: PublicClientApplication | null = entraEnv
  ? createMsalInstance(entraEnv, readPreference())
  : null;

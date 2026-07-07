/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Microsoft Entra ID テナント ID（参考。authority に内包される）。 */
  readonly VITE_AZURE_TENANT_ID?: string;
  /** Entra アプリ（SPA）のクライアント ID。MSAL を有効化する必須値。 */
  readonly VITE_AZURE_CLIENT_ID?: string;
  /** Entra 認証オーソリティ（例: https://login.microsoftonline.com/<tenantId>）。必須値。 */
  readonly VITE_AZURE_AUTHORITY?: string;
  /** バックエンド API スコープ（例: api://<appId>/access_as_user）。 */
  readonly VITE_AZURE_API_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

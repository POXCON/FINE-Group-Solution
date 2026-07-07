# Microsoft Entra ID 認証設定（fine-verify-app）

> AWS Cognito → Microsoft Entra ID 移行の検証用アプリ登録の**非秘密**設定です。
> 個人テナントでの検証環境（Refs: #71）。本ファイルには秘密情報を記載しません。
> **クライアントシークレットは発行していません**（SPA はパブリッククライアントとして扱います）。

## 1. アプリ登録概要

| 項目 | 値 |
|------|-----|
| 表示名 | `fine-verify-app` |
| サインイン対象 (`signInAudience`) | `AzureADMyOrg`（単一テナント） |
| Tenant ID | `555dafe8-9dde-4f98-ac9b-904e08b28c58` |
| 既定ドメイン | `kentaishii1996outlook.onmicrosoft.com` |
| Application (client) ID | `76537176-b582-4055-8b3e-cf89e84e1c08` |
| Application ID URI | `api://76537176-b582-4055-8b3e-cf89e84e1c08` |
| アクセストークンバージョン | v2（`requestedAccessTokenVersion: 2`） |

> Tenant ID / Client ID / Application ID URI は秘密情報ではないため記載可。

## 2. SPA リダイレクト URI（プラットフォーム: SPA）

- `http://localhost:5173/`（Vite ローカル開発）
- `http://localhost:4280/`（Azure Static Web Apps ローカル `swa start`）

> **TODO（本番）**: SWA 本番 URL（例 `https://<swa-name>.azurestaticapps.net/`）は
> デプロイ後にこの SPA プラットフォームへ追加する。カスタムドメイン利用時はそのドメインも追加する。

## 3. 公開 API スコープ

| スコープ | 値 | 同意 | 状態 |
|----------|-----|------|------|
| `access_as_user` | `api://76537176-b582-4055-8b3e-cf89e84e1c08/access_as_user` | 管理者/ユーザー同意可（`type: User`） | 有効 |

## 4. App Roles（`allowedMemberTypes: ["User"]`, enabled）

| value | displayName | App Role ID |
|-------|-------------|-------------|
| `admin` | 管理者 | `f89e918f-81c9-43af-bd29-c094753a8521` |
| `store` | 店舗 | `421bd841-d6a7-467b-bb6b-18fdf5813011` |
| `manager` | マネージャー | `842cc710-00cc-459f-8ae7-ec9199064c88` |

- ロールが割り当てられたプリンシパルには、ID トークン・アクセストークンに
  `roles` クレーム（例: `["admin"]`）が自動的に付与される（追加の optional claims 設定は不要）。

## 5. サービスプリンシパル / ロール割当

| 項目 | 値 |
|------|-----|
| Service Principal Object ID | `13bac555-aabe-44ac-a86f-90a1a5058553` |
| admin 割当先ユーザー | `kenta.ishii1996@outlook.jp`（テナント所有者、外部メンバー） |
| ユーザー Object ID | `7a707ff9-2aac-4046-873d-3edb143dec2b` |
| 割当 App Role | `admin`（`f89e918f-81c9-43af-bd29-c094753a8521`） |

## 6. Frontend 用環境変数（Vite / MSAL）

```dotenv
VITE_AZURE_TENANT_ID=555dafe8-9dde-4f98-ac9b-904e08b28c58
VITE_AZURE_CLIENT_ID=76537176-b582-4055-8b3e-cf89e84e1c08
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/555dafe8-9dde-4f98-ac9b-904e08b28c58
VITE_AZURE_API_SCOPE=api://76537176-b582-4055-8b3e-cf89e84e1c08/access_as_user
```

## 7. Backend 用環境変数（FastAPI / JWT 検証）

```dotenv
AZURE_TENANT_ID=555dafe8-9dde-4f98-ac9b-904e08b28c58
# アクセストークンの aud はクライアントによって api://<appId> または <appId> の
# いずれかで来る。両方を許容すること。
AZURE_API_AUDIENCE=api://76537176-b582-4055-8b3e-cf89e84e1c08
AZURE_API_AUDIENCE_ALT=76537176-b582-4055-8b3e-cf89e84e1c08
REQUIRED_APP_ROLE=admin
```

- Issuer（v2）: `https://login.microsoftonline.com/555dafe8-9dde-4f98-ac9b-904e08b28c58/v2.0`
- JWKS: `https://login.microsoftonline.com/555dafe8-9dde-4f98-ac9b-904e08b28c58/discovery/v2.0/keys`
- OpenID 構成: `https://login.microsoftonline.com/555dafe8-9dde-4f98-ac9b-904e08b28c58/v2.0/.well-known/openid-configuration`
- 検証手順: 署名（JWKS）→ `iss` 一致 → `aud`（上記いずれか）一致 → `exp/nbf` →
  `roles` に `REQUIRED_APP_ROLE`（`admin`）を含むこと。

## 8. Cognito → Entra ID 対応表

| 観点 | AWS Cognito | Microsoft Entra ID |
|------|-------------|--------------------|
| ロールクレーム | `cognito:groups` | `roles` |
| ロール値の例 | `fine-admin` | `admin` |
| ロール値の例 | `fine-store` | `store` |
| ロール値の例 | `fine-manager` | `manager` |
| 発行者 (issuer) | `https://cognito-idp.<region>.amazonaws.com/<userPoolId>` | `https://login.microsoftonline.com/<tenantId>/v2.0` |
| 公開鍵 (JWKS) | `.../.well-known/jwks.json` | `.../discovery/v2.0/keys` |
| Audience | App Client ID | `api://<appId>` または `<appId>` |
| ユーザー識別子 | `sub` / `cognito:username` | `oid` / `sub` |

> バックエンドのロール判定は `cognito:groups` 参照から `roles` 参照へ移行する。
> `fine-` プレフィックスは Entra 側では付けず、`admin` / `store` / `manager` を素の値とする。

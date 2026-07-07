# Invoice-Search API 契約（フロント ↔ バックエンド）

> P3a で統一した正典契約。フロント（Vite/React）と FastAPI バックエンドはこの契約に準拠する。
> 変更時は両側＋テスト（FE unit/E2E・BE unit/integration）を同時に更新すること。

## 認証
- すべての `/api/*` は **Bearer JWT（Entra ID アクセストークン）** を要求（本番）。
- フロントは `Authorization: Bearer <accessToken>` を付与。`AUTH_DISABLED=true`（ローカル/モック）時はトークン不要。

## POST /api/invoice-search
インボイス番号を国税庁 公表 Web-API で照会する。

**リクエスト**
```json
{ "invoiceNum": ["T1234567890123", "T9876543210987"] }
```
- `invoiceNum`: 1〜10 件。各要素は `^T?\d{13}$`。**追加フィールドは不可（422）**。

**レスポンス 200**
```json
{
  "results": [
    {
      "invoiceNumber": "T1234567890123",
      "name": "株式会社テスト",
      "address": "東京都千代田区1-1-1",
      "tradeName": "テスト商店",
      "invoiceCheck": true
    }
  ]
}
```
- `name` / `address` / `tradeName`: 公表が無い場合 `null`。
- `invoiceCheck`: `true`=登録済み / `false`=失効・取消 / `null`=不明（NTA `process` を BE 側で解釈。コード確定は TODO）。

**エラー**
- `422` 入力不正（`{"detail":"Invalid request."}`）
- `401` 未認証 / トークン不正
- `502` 上流（国税庁API）失敗

## POST /api/logs
フロントの運用/エラーイベントを構造化ログ（Azure Log Analytics）へ転送。`204 No Content`。要 JWT。

## フロント設定
- `VITE_API_BASE_URL`: 任意。未設定なら**同一オリジン相対**（Static Web Apps 経由で `/api/*`→Container Apps）。
- `VITE_AZURE_TENANT_ID` / `VITE_AZURE_CLIENT_ID`: 設定時は Entra ID (MSAL) 認証、未設定ならモック認証。

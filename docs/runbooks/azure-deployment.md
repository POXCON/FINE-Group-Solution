# Azure デプロイ手順（Bicep / Entra ID / Static Web Apps + Container Apps）

> **対象**: Azure でのアプリケーション構築・デプロイを実施する方。
> **前提**: [azure-account-setup.md](azure-account-setup.md) を完了し、Azure CLI / Docker / Git がインストール済み。
> 所要時間: 約 45–60 分（初回・ビルド・デプロイ含む）。OS は **Windows 11 / PowerShell** を前提。
> 最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

---

## このガイドのゴール

- [ ] Bicep で Azure リソース（RG / Storage / Container Apps / SWA 等）をコード定義
- [ ] ローカルで FastAPI / React をビルド
- [ ] Docker イメージを Azure Container Registry（ACR）に push
- [ ] Container Apps・Static Web Apps にデプロイ
- [ ] Azure Entra ID 認証（MSAL）を設定
- [ ] ブラウザで動作確認
- [ ] デプロイ破棄方法を理解

---

## STEP 1. 環境・リポジトリの準備

### 1-1. リポジトリをクローン・develop 起点で作業

```powershell
git clone https://github.com/POXCON/FINE-Group-Solution.git
cd FINE-Group-Solution
git checkout develop
```

### 1-2. 環境変数を定義

`Common/infra/azure/.env.local` を作成（参考値）:

```
SUBSCRIPTION_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
RESOURCE_GROUP="rg-fine-grp-dev"
LOCATION="japaneast"
CONTAINER_REGISTRY_NAME="acrfinegrpdev"
CONTAINER_APP_NAME="ca-fine-grp-api"
STATIC_WEB_APP_NAME="swa-fine-grp-web"
```

> **秘密情報について**: クライアント ID・テナント ID は非秘密。シークレット・キーは環境変数でのみ管理（.gitignore 含める）。

### 1-3. リソースグループの確認

```powershell
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.Insights
az account show
```

---

## STEP 2. Bicep を使ったリソース作成

### 2-1. Bicep デプロイコマンド

```powershell
cd Common/infra/azure

# リソースグループ作成
az group create --name "rg-fine-grp-dev" --location "japaneast"

# Bicep デプロイ
az deployment group create `
  --name "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
  --resource-group "rg-fine-grp-dev" `
  --template-file "main.bicep" `
  --parameters "main.bicepparam"
```

想定出力: Deployment succeeded

---

## STEP 3. Docker イメージのビルド・ACR へ push

### 3-1. Azure Container Registry にログイン

```powershell
az acr login --name acrfinegrpdev
```

### 3-2. FastAPI バックエンド用イメージをビルド

```powershell
cd ../../../
cd Invoice-Search/backend
docker build -t acrfinegrpdev.azurecr.io/fine-grp-api:latest .
docker push acrfinegrpdev.azurecr.io/fine-grp-api:latest
cd ../../
```

---

## STEP 4. Azure Container Apps へバックエンドをデプロイ

### 4-1. 環境変数・シークレット注入

```powershell
az containerapp secret set `
  --name ca-fine-grp-api `
  --resource-group rg-fine-grp-dev `
  --secrets entra-client-id="<CLIENT_ID>"

az containerapp update `
  --name ca-fine-grp-api `
  --resource-group rg-fine-grp-dev `
  --set-env-vars CORS_ORIGINS="http://localhost:5173 https://swa-fine-grp-web.azurestaticapps.net"
```

### 4-2. ログ確認

```powershell
az containerapp logs show `
  --name ca-fine-grp-api `
  --resource-group rg-fine-grp-dev `
  --follow
```

想定出力: Uvicorn running on http://0.0.0.0:8000

---

## STEP 5. Static Web Apps へフロントエンドをデプロイ

### 5-1. SWA CLI でビルド・デプロイ

```powershell
cd Common/frontend
npm install
npm install -g @azure/static-web-apps-cli

swa deploy --deployment-token "DEPLOYMENT_TOKEN_FROM_PORTAL"
```

### 5-2. ブラウザで確認

https://swa-fine-grp-web.azurestaticapps.net にアクセス。ポータル画面が表示されることを確認。

---

## STEP 6. Azure Entra ID 認証設定

### 6-1. アプリ登録でリダイレクト URI を更新

1. [Azure Portal](https://portal.azure.com/) → アプリ登録 → `fine-grp-web` を選択。
2. 認証 → Single Page Application (SPA) にリダイレクト URI を追加:
   ```
   https://swa-fine-grp-web.azurestaticapps.net/auth/callback
   ```

### 6-2. AppRoles 定義（初回のみ）

マニフェストで appRoles を確認（admin/store/manager）。

### 6-3. テストユーザー作成

Azure Portal → Entra ID → ユーザー → テストユーザーを作成。ロール割り当て。

---

## STEP 7. ブラウザでの動作確認

1. https://swa-fine-grp-web.azurestaticapps.net へアクセス
2. ログインボタンをクリック
3. Entra ID 画面でサインイン
4. トークン取得後、ポータル画面へリダイレクト
5. 「インボイス番号検索」カード → /invoice-search へ遷移確認

---

## STEP 8. デプロイの破棄

```powershell
az group delete --name rg-fine-grp-dev --yes
```

リソースグループ内の全リソースが削除されます。

---

## 用語集

| 用語 | 説明 |
|------|------|
| **Bicep** | Azure Resource Manager を簡潔に記述する言語 |
| **Container Apps** | Docker コンテナをホストするサーバレスプラットフォーム（scale-to-zero） |
| **Static Web Apps** | React・Vue 等の SPA をホストするサービス（無料枠あり・https・CDN 自動） |
| **ACR** | Azure Container Registry。Docker イメージ保管 |
| **Log Analytics** | ログ集約・分析サービス |
| **Entra ID** | Microsoft の ID・認証サービス。AppRoles でロール管理 |

---

## トラブルシュート

### Q. Bicep デプロイ時に ResourceNotFound エラー

```powershell
az provider register --namespace Microsoft.App
Start-Sleep -Seconds 30
# 再度デプロイ
```

### Q. Docker push で認証エラー

```powershell
az acr login --name acrfinegrpdev --expose-token
docker login acrfinegrpdev.azurecr.io -u 00000000-0000-0000-0000-000000000000 -p <TOKEN>
```

### Q. Container Apps で "Timeout waiting for container to start"

1. Dockerfile の EXPOSE 8000 が正しいか確認
2. FastAPI が 0.0.0.0:8000 でリッスンしているか確認
3. ログ確認: `az containerapp logs show --name ca-fine-grp-api ...`

### Q. Entra ID ログイン後、roles クレームが空

1. ユーザーがロール割り当てされているか確認
2. アプリ登録のマニフェストで appRoles が正しく定義されているか確認
3. MSAL 設定で scopes に .default が含まれているか確認

---

## Cognito からの移行ノート

| 項目 | 旧（Cognito） | 新（Entra ID） |
|------|--------------|---------------|
| **ユーザー管理** | Cognito User Pools | Entra ID テナント |
| **グループ** | cognito:groups クレーム | roles クレーム（AppRoles） |
| **認証ライブラリ** | amazon-cognito-identity-js | MSAL for JavaScript |
| **キャッシュ制御** | CognitoUserPool({ Storage }) | MSAL PublicClientApplication({ cacheLocation }) |
| **リダイレクト URI** | http://localhost:3000/callback | http://localhost:5173/auth/callback（Vite） |

---

## 次のステップ

デプロイ完了後:
1. **本番環境（PRD）**: 別テナント・Front Door Premium・条件付きアクセス設定（#68 参照）
2. **CI/CD パイプライン**: GitHub Actions で自動デプロイ化
3. **カスタムドメイン**: SWA へカスタムドメインを割り当て

詳細は [`/CLAUDE.md`](../../CLAUDE.md) 参照。

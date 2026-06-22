# Invoice-Search インフラ（AWS CDK）

最小・最安構成（**DB 無し**）で Invoice-Search を AWS にデプロイする CDK プロジェクト。
共通の前提・コスト管理は [`docs/runbooks/aws-account-setup.md`](../../docs/runbooks/aws-account-setup.md) と
[`docs/runbooks/aws-deployment.md`](../../docs/runbooks/aws-deployment.md) を参照。

## 構成（スタック）
| スタック | 内容 |
|---|---|
| `InvoiceSearchAuth` | Cognito User Pool + App Client（メール/パスワード・管理者作成） |
| `InvoiceSearchApi` | Lambda(FastAPI + Mangum) + API Gateway(HTTP API)。国税庁設定は SSM から取得 |
| `InvoiceSearchWeb` | S3(非公開) + CloudFront(OAC)。`/api/*`→API GW, default→S3, SPA 書き換え |

DB / VPC / NAT は無し。アイドル時はほぼ $0。

## 前提
- [aws-account-setup.md](../../docs/runbooks/aws-account-setup.md) 完了（CLI 認証・予算アラート）
- **Docker Desktop が起動中**（Lambda の Python 依存をビルドするため）
- `aws sso login --profile fine-admin` 済み／`$env:AWS_PROFILE = "fine-admin"`

## 事前準備：SSM パラメータ（国税庁 公表 Web-API 設定）
デプロイ前に 2 つのパラメータを作成（値はお手元の登録情報）:
```powershell
aws ssm put-parameter --name "/fine/invoice-search/nta-app-id"  --type String --value "<国税庁から発行された App ID>"
aws ssm put-parameter --name "/fine/invoice-search/nta-api-url" --type String --value "<国税庁 公表Web-API のURL>"
```
> App ID は機微度が低いため String。より厳格にするなら SecureString + CDK 側参照に変更可。

## デプロイ手順
```powershell
$env:AWS_PROFILE = "fine-admin"
cd Invoice-Search/infra
npm install

# 1) 初回のみ: ブートストラップ
npx cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1

# 2) 認証・API を先にデプロイ（出力に UserPoolId / UserPoolClientId / ApiUrl）
npx cdk deploy InvoiceSearchAuth InvoiceSearchApi

# 3) フロントの本番ビルド（Cognito 設定を注入）
#    手動でも可: frontend/.env.production に VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID を記載
powershell -ExecutionPolicy Bypass -File scripts/configure-frontend-env.ps1
cd ../frontend ; npm ci ; npm run build ; cd ../infra

# 4) フロント配信（S3+CloudFront）をデプロイ（出力に 公開URL）
npx cdk deploy InvoiceSearchWeb
```
> API は CloudFront 同一オリジンの `/api/*` 経由のため、フロントの `VITE_API_BASE_URL` は不要（未設定=相対）。

## ログインユーザーの作成（Cognito）
```powershell
$pool = (aws cloudformation describe-stacks --stack-name InvoiceSearchAuth --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
aws cognito-idp admin-create-user --user-pool-id $pool --username store01@example.com `
  --user-attributes Name=email,Value=store01@example.com Name=email_verified,Value=true
aws cognito-idp admin-set-user-password --user-pool-id $pool --username store01@example.com --password '<強いパスワード>' --permanent
```

## 動作確認
- `InvoiceSearchWeb` 出力の公開URL を開く → 作成したユーザーでログイン → 検索が成功。

## 破棄（dev のクリーンアップ）
```powershell
npx cdk destroy InvoiceSearchWeb InvoiceSearchApi
# Auth は RemovalPolicy.RETAIN（ユーザー保護）。完全削除はコンソールから User Pool を手動削除。
```

## 注意
- `InvoiceSearchWeb` のデプロイ前に **`frontend/dist`（本番ビルド）** が必要。
- 本番運用に移行する場合、S3 の `removalPolicy`（現状 DESTROY）と Auth の保持方針を見直すこと。

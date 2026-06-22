# FINE 統合 CloudFront インフラ（AWS CDK）

**1 つの CloudFront** で FINE グループの各アプリと API を**同一オリジン**配信する CDK プロジェクト。
共通の前提・コスト管理は [`docs/runbooks/aws-account-setup.md`](../../docs/runbooks/aws-account-setup.md) と
[`docs/runbooks/aws-deployment.md`](../../docs/runbooks/aws-deployment.md) を参照。

## 配信設計（パス）
| パス | 配信元 | 内容 |
|---|---|---|
| `/` | S3（バケット直下） | ポータル(Common) SPA |
| `/invoice-search/` | S3（`invoice-search/` プレフィックス） | Invoice-Search SPA |
| `/api/*` | API Gateway（HTTP API） | バックエンド API（同一オリジン・CORS 不要） |

- 単一の **S3 バケット（非公開・OAC）** に 2 つのフロント `dist` を配置（ポータルは直下、Invoice-Search は `invoice-search/`）。
- SPA ルーティングは **CloudFront Function**（VIEWER_REQUEST）で各アプリの `index.html` へ書き換え。
- **Lambda は無し**（API は既存の API Gateway をオリジンに参照）。よって **Docker 不要**。

## スタック
| スタック | 内容 |
|---|---|
| `FineUnifiedWeb` | S3(非公開) + CloudFront(OAC)。`/`→ポータル, `/invoice-search/`→Invoice-Search, `/api/*`→API GW |

DB / VPC / NAT / Lambda は無し。アイドル時はほぼ $0。

## 前提
- [aws-account-setup.md](../../docs/runbooks/aws-account-setup.md) 完了（CLI 認証・予算アラート）
- `aws sso login --profile fine-admin` 済み／`$env:AWS_PROFILE = "fine-admin"`
- **両フロントが本番ビルド済み**であること:
  - `Common/frontend/dist`（Cognito env 注入済み）
  - `Invoice-Search/frontend/dist`（`base=/invoice-search/` で既にビルド構成済み）
- **Docker は不要**（本スタックは Lambda を含まない）。

## API オリジン
既定の API ドメインは Invoice-Search の HTTP API。別の API を指す場合は context で上書き:
```powershell
npx cdk deploy -c apiDomain=xxxx.execute-api.ap-northeast-1.amazonaws.com
```

## デプロイ手順
```powershell
$env:AWS_PROFILE = "fine-admin"
cd Common/infra
npm install

# 1) 初回のみ: ブートストラップ
npx cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1

# 2) ポータルの本番ビルド（Cognito 設定を注入）
#    手動でも可: Common/frontend/.env.production に VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID を記載
powershell -ExecutionPolicy Bypass -File scripts/configure-frontend-env.ps1
cd ../frontend ; npm ci ; npm run build ; cd ../infra

# 3) Invoice-Search フロントの本番ビルド（base=/invoice-search/ で構成済み）
cd ../../Invoice-Search/frontend ; npm ci ; npm run build ; cd ../../Common/infra

# 4) 統合配信（S3 へ両 dist 配置 ＋ CloudFront 作成）をデプロイ（出力に 公開URL）
npx cdk deploy FineUnifiedWeb
```
> API は CloudFront 同一オリジンの `/api/*` 経由のため、フロントの `VITE_API_BASE_URL` は不要（未設定=相対）。

## 動作確認
- `FineUnifiedWeb` 出力の公開URL を開く → ポータル表示。
- `/invoice-search/` へ遷移 → Invoice-Search 表示・検索が成功（`/api/*` 経由）。

## 旧スタックの破棄（本番切替後）
- 旧 `InvoiceSearchWeb`（Invoice-Search 単体の CloudFront）は、本統合 CloudFront への**本番切替後に PM が** `cdk destroy` する。
  ```powershell
  cd ../../Invoice-Search/infra
  npx cdk destroy InvoiceSearchWeb
  ```

## 破棄（dev のクリーンアップ）
```powershell
npx cdk destroy FineUnifiedWeb
```

## 注意
- デプロイ前に **両フロントの `dist`（本番ビルド）** が必要。
- 2 本の `BucketDeployment` が同一バケットを共有するため、相互削除を避ける目的で**両方に `prune: false`** を設定している。
- 本番運用に移行する場合、S3 の `removalPolicy`（現状 DESTROY）を見直すこと。

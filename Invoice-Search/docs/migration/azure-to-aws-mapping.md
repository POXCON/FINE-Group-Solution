# Azure → AWS 移行マッピング（P0 / #2）

> 既存の Azure 依存箇所を洗い出し、AWS 標準（低コスト最優先）への置換対象を確定する。
> 関連: Epic #1 / 要件棚卸し [`requirements-inventory.md`](requirements-inventory.md) / 手順書 [`/docs/runbooks/aws-deployment.md`](../../../docs/runbooks/aws-deployment.md)。

## マッピング表

| 項目 | 既存（Azure） | 該当箇所 | 移行先（AWS） | フェーズ |
|------|---------------|----------|----------------|----------|
| 認証 | App Service EasyAuth `/.auth/me`（Google 連携） | `interface/AuthMe/getAuthMe.ts` | **Amazon Cognito**（IdP に Google 設定可） | P3 (#5) |
| ログ/監視 | opencensus + Application Insights | `backend/AzLog/azlog.py` | **CloudWatch（構造化ログ）** | P1/P3 |
| アプリ実行（FE 配信） | App Service（静的配信）/ `web.config`(IIS) | `frontend/public/web.config` | **S3 + CloudFront**（web.config 廃止） | P3 |
| アプリ実行（BE） | App Service（FastAPI/uvicorn） | `backend/main.py` | **Lambda + API Gateway**（FastAPI + Mangum） | P1/P3 |
| シークレット | App Settings 環境変数 | `INVOICE_APP_ID` / 接続文字列 | **Secrets Manager**（ハードコード禁止） | P3 |
| DB | （現状 DB 未使用） | — | 必要時 **Aurora Serverless v2 + Data API**（既定） | P3 |
| 依存ライブラリ | `opencensus-ext-azure`, `azure.identity` | `backend/requirements.txt` | 削除（AWS SDK `boto3` / 標準 logging へ） | P1 |

## 注意点
- **認証移行（P3）が FE/BE 双方に波及**: `/.auth/me` 依存を Cognito（JWT）へ置換し、backend は JWT 検証で `userId` を取得（ボディ信頼を廃止）。
- **NAT コスト回避**: Aurora は **Data API（HTTPS）** で接続し VPC/NAT を作らない。
- **リージョン**: `ap-northeast-1`（東京）。
- 機微情報（公表API の `INVOICE_APP_ID` 等）は **Secrets Manager** 管理に統一。

## 移行順序（Epic 方針に準拠）
1. P1: backend を AWS 前提に整備（ログ→CloudWatch、httpx、Cognito 検証 IF、シークレット参照）。
2. P2: frontend を新標準へ刷新（認証 IF は Cognito 前提のアダプタに）。
3. P3: 実インフラ（Cognito/Aurora/Lambda/S3+CloudFront）を CDK で構築・接続。
4. P4: E2E/UI-UX/CI で検証。

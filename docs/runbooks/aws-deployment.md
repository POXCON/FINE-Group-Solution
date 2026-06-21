# AWS デプロイ手順書（CDK 標準）

> **状態: v0.1（ドラフト）** — 実構築は Invoice-Search 移行 P3（#5）で検証し、確定値・スクリーンショットを反映する。
> 最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)、インフラ標準は CLAUDE.md「3. 技術スタック標準 / インフラ・DB」を参照。

## 0. 標準アーキテクチャ（低コスト最優先）

| レイヤ | サービス | 備考 |
|--------|----------|------|
| 認証 | **Amazon Cognito** | 店舗ごとユーザー払い出し。無料枠内。 |
| フロント配信 | **S3 + CloudFront** | 静的ホスティング（Vite ビルド成果物）。 |
| バックエンド実行 | **Lambda + API Gateway** | FastAPI を **Mangum** で接続。ゼロスケール。 |
| DB | **Aurora Serverless v2 + Data API** | アイドル時 0 ACU 自動休止。VPC/NAT 不要。 |
| シークレット | **Secrets Manager** | API キー・接続情報。ハードコード禁止。 |
| ログ/監視 | **CloudWatch** | 構造化ログ。 |
| IaC | **AWS CDK（TypeScript）** | リージョン **ap-northeast-1（東京）**。 |

> 想定コスト: 現状の利用規模（1 店舗あたり 1 日数名・同時アクセスほぼ無し）で **概ね月 $5–15**。

## 1. 前提（事前準備）

- [ ] AWS アカウント（請求アラート設定済み）
- [ ] IAM: デプロイ用ロール／ユーザー（最小権限）
- [ ] ローカル: `aws` CLI v2、`node`(LTS)、`npm`、`aws-cdk`（`npm i -g aws-cdk`）、Python 3.12.10
- [ ] 認証情報: `aws configure`（または SSO）でプロファイル設定
- [ ] リージョン: `ap-northeast-1`

```bash
aws sts get-caller-identity        # 認証確認
cdk --version                      # CDK 確認
```

## 2. CDK ブートストラップ（アカウント/リージョン初回のみ）

```bash
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1
```

## 3. スタック構成（推奨）

```
infra/                         # CDK プロジェクト（システム配下 or 専用）
├── bin/app.ts
├── lib/
│   ├── auth-stack.ts          # Cognito User Pool / Client
│   ├── data-stack.ts          # Aurora Serverless v2 (Data API 有効) + Secrets Manager
│   ├── api-stack.ts           # Lambda(FastAPI+Mangum) + API Gateway
│   └── web-stack.ts           # S3 + CloudFront (OAC)
└── cdk.json
```

- 環境は `dev` / `prod` をコンテキストで分離（`cdk deploy -c env=dev`）。
- Aurora は **Data API 有効化**、最小 ACU 0（自動休止）／最大 ACU は負荷に応じ小さく設定。

## 4. バックエンド（FastAPI → Lambda）

- `Mangum(app)` を Lambda ハンドラに設定。
- DB アクセスは **RDS Data API（HTTPS）** を使用し VPC/NAT を回避。
- 環境変数・接続情報は **Secrets Manager** から取得。

## 5. フロントエンド（Vite → S3 + CloudFront）

```bash
cd <System>/frontend
npm ci && npm run build        # dist/ を生成
# CDK の BucketDeployment で dist/ を S3 へ配置し、CloudFront を Invalidation
```

## 6. デプロイ

```bash
cd infra
npm ci
cdk diff   -c env=dev          # 差分確認
cdk deploy -c env=dev --all    # デプロイ
```

## 7. デプロイ後チェック

- [ ] CloudFront URL でフロントが表示される
- [ ] API Gateway 経由で `/` ヘルスチェックが 200
- [ ] Cognito ログイン → 保護 API が JWT 検証で通る
- [ ] Aurora が休止→復帰で正常応答（初回数秒のコールドスタート許容）
- [ ] CloudWatch にログ出力、機微情報が出ていない

## 8. ロールバック / 破棄

```bash
cdk deploy -c env=dev          # 前バージョンの再デプロイ
cdk destroy -c env=dev --all   # 環境破棄（dev のみ。prod は要承認）
```

## 9. コスト最適化メモ

- **NAT Gateway を作らない**（Data API 採用で不要）。VPC RDS が必要な場合のみ VPC エンドポイント。
- CloudFront / S3 / Lambda / Cognito は当初ほぼ無料枠内。
- 請求アラート（予算 $X/月）を必ず設定。

---

> 本手順は P3（#5）で実環境にて検証し、確定コマンド・出力例・構成図を追記する。

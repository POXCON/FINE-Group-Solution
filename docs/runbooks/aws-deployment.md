# AWS デプロイ手順書（CDK 標準・詳細版）

> **状態: v0.2** — アカウント整備〜デプロイ〜運用〜破棄までを詳細化。実構築（P3 / #5）で確定値・コンソール画面を追記する。
> **はじめての方は先に [aws-account-setup.md](aws-account-setup.md) を完了してください。**
> 最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)、インフラ標準は CLAUDE.md「3. 技術スタック標準 / インフラ・DB」。共通 UI は [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)。

---

## 0. 全体像（何を、なぜ）

このシステムは **「使っていない間はほぼ課金されない」** 低コスト構成で AWS に載せます。

| レイヤ | サービス | 役割 | コストの考え方 |
|--------|----------|------|----------------|
| 認証 | **Amazon Cognito** | 店舗ユーザーのログイン（メール/パスワード） | 月間アクティブユーザーが少なく**無料枠内**の想定 |
| フロント配信 | **S3 + CloudFront** | 画面（Vite ビルド成果物）を世界中へ高速配信 | 静的配信。アクセス少なら**ほぼ無料** |
| API 実行 | **Lambda + API Gateway** | FastAPI を **Mangum** 経由で実行 | リクエスト課金。呼ばれた分だけ＝**ゼロスケール** |
| DB | **Aurora Serverless v2 + Data API** | PostgreSQL。HTTPS でアクセス | **アイドルで 0 ACU 自動休止**。VPC/NAT 不要で固定費を回避 |
| 秘密情報 | **Secrets Manager** | DB 接続情報・API キー | 数百円/月程度 |
| ログ/監視 | **CloudWatch** | 構造化ログ・メトリクス | 少量なら無料枠内 |
| IaC | **AWS CDK（TypeScript）** | 上記を**コードで**一括構築 | — |

- **リージョン**: 東京 **ap-northeast-1**（全サービス提供を確認済み）。
- **想定コスト**: 現状規模（1 店舗 1 日数名・同時アクセスほぼ無し）で **概ね月 $5–15**。

> **なぜ NAT Gateway を使わないのか**: 通常 RDS は VPC 内に置き、Lambda から繋ぐと NAT Gateway（約 $32/月〜の固定費）が要ります。本構成は **RDS Data API（HTTPS 経由）** を使うため VPC/NAT が不要で、固定費を大きく削減できます。

> **Aurora の 0 ACU 自動休止について（確認済み仕様）**: Aurora Serverless v2（最新 v3 プラットフォーム）は最小容量 **0 ACU** を設定でき、接続が無い状態が続くと自動休止します。再接続時に自動復帰（初回のみ数秒のコールドスタート）。休止までの時間 `SecondsUntilAutoPause` は **300〜86,400 秒**で設定（本番は 300〜900 秒を推奨）。

---

## 1. 事前確認（チェックリスト）

[aws-account-setup.md](aws-account-setup.md) 完了済みであること。加えて:

- [ ] `aws sts get-caller-identity --profile fine-admin` が成功する
- [ ] `cdk --version` / `node -v` / `python --version` が表示される
- [ ] **アカウント ID（12 桁）** を控えている
- [ ] 既定リージョンが `ap-northeast-1`

```powershell
aws sso login --profile fine-admin
aws sts get-caller-identity --profile fine-admin   # Account 等が返れば OK
```

> 以降のコマンドは **`--profile fine-admin`** を付けるか、`$env:AWS_PROFILE = "fine-admin"` をセッションに設定して実行します。

---

## 2. IaC プロジェクト（`infra/`）について

CDK のコード一式（`infra/`）は **P3（#5）で作成**します。完成後の構成は次の想定です。

```
infra/                         # CDK プロジェクト（リポジトリ直下 or 専用）
├── bin/app.ts                 # スタックの組み立て
├── lib/
│   ├── auth-stack.ts          # Cognito User Pool / App Client
│   ├── data-stack.ts          # Aurora Serverless v2(Data API 有効) + Secrets Manager
│   ├── api-stack.ts           # Lambda(FastAPI+Mangum) + API Gateway
│   └── web-stack.ts           # S3 + CloudFront(OAC)
├── cdk.json
└── package.json
```

- 環境は **`dev` / `prod`** をコンテキストで分離（`cdk deploy -c env=dev`）。
- まだ `infra/` が無い段階では、本書 STEP 3 以降は「P3 実装後に実行する手順」として参照してください。

> P3 では本書のコマンド出力・コンソール画面を撮影し、確定版（v1.0）に更新します。

---

## 3. CDK ブートストラップ（アカウント×リージョンで初回 1 回）

CDK が使う土台（デプロイ用 S3 バケット等）を作成します。

```powershell
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1 --profile fine-admin
```

- **何が起きるか**: `CDKToolkit` という CloudFormation スタックが作られます（デプロイ用バケット/ロール等）。
- **確認**: マネジメントコンソール → **CloudFormation** → スタック一覧に `CDKToolkit` が `CREATE_COMPLETE`。

---

## 4. データ層（Aurora Serverless v2 + Data API）

`infra/lib/data-stack.ts` が作る主な内容と要点:

- **Aurora PostgreSQL（Serverless v2）クラスター**
  - `ServerlessV2ScalingConfiguration`: **MinCapacity = 0**、MaxCapacity = 1〜2（小さく）、`SecondsUntilAutoPause = 300`
  - **Data API を有効化**（`enableDataApi: true` 相当）
  - エンジンは **Data API 対応バージョン**（Aurora PostgreSQL 15.3 以降 など）
- **Secrets Manager** に DB 認証情報を自動生成・格納（パスワードのハードコード禁止）
- Lambda には **Data API 実行権限**（`rds-data:*`）と **Secret 読み取り権限** を付与

> **ポイント**: アプリは psycopg などのドライバ接続ではなく、**RDS Data API（HTTPS）** で SQL を実行します。これにより VPC 配線・NAT・コネクション管理が不要になります。

デプロイ後の確認（コンソール）:
- **RDS** → データベース → クラスターが「利用可能」。容量が無操作で **0 ACU** へ下がる。
- **Secrets Manager** → DB 用シークレットが存在。

---

## 5. バックエンド（FastAPI → Lambda）

`Invoice-Search/backend` の FastAPI を Lambda で動かします。

1. **Mangum でハンドラ化**（アプリ本体は不変）:
   ```python
   # lambda_handler.py（P3 で追加）
   from mangum import Mangum
   from app.main import app
   handler = Mangum(app)
   ```
2. **依存を含めてパッケージ化**（Lambda レイヤ or コンテナイメージ）。`requirements.txt` に `mangum` を追加。
3. **環境変数**（CDK が注入）:
   - `DB_CLUSTER_ARN` / `DB_SECRET_ARN` / `DB_NAME`（Data API 用）
   - `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` / `COGNITO_REGION`（JWT 検証用）
   - `AUTH_DISABLED=false`（本番は必ず false）
4. **DB アクセスは Data API** 経由（`boto3` の `rds-data` クライアント、または SQLAlchemy + Data API 方言）。

確認（コンソール）:
- **Lambda** → 関数が存在し、テスト実行 or API 経由で 200。
- **API Gateway** → ステージ URL が払い出されている。
- **CloudWatch Logs** → 構造化ログが出る／機微情報が出ていない。

---

## 6. フロントエンド（Vite → S3 + CloudFront）

1. ビルド:
   ```powershell
   cd "Invoice-Search/frontend"
   npm ci
   npm run build            # dist/ が生成される
   ```
2. **API のエンドポイント** をビルド時環境変数で指定（例 `VITE_API_BASE_URL`）。Cognito 設定（User Pool ID / Client ID / Region）も `.env.production` で注入。
3. CDK の **BucketDeployment** が `dist/` を S3 へ配置し、**CloudFront を Invalidation**（キャッシュ更新）。

確認（コンソール）:
- **CloudFront** → ディストリビューションの **ドメイン名**（`xxxx.cloudfront.net`）でフロントが表示。
- **S3** → 配信用バケットに `index.html` 等が存在（**バケットは非公開**、CloudFront OAC 経由のみ許可）。

---

## 7. ログインできるようにする（Cognito ユーザー作成）

店舗ユーザーを払い出します（メール/パスワード）。コンソールでもコマンドでも可。

```powershell
# 管理者がユーザーを作成（初回パスワードを設定）
aws cognito-idp admin-create-user `
  --user-pool-id <USER_POOL_ID> `
  --username store01@example.com `
  --user-attributes Name=email,Value=store01@example.com Name=email_verified,Value=true `
  --profile fine-admin

# 恒久パスワードを設定（仮パスワード強制変更を回避したい場合）
aws cognito-idp admin-set-user-password `
  --user-pool-id <USER_POOL_ID> `
  --username store01@example.com `
  --password '<強いパスワード>' --permanent `
  --profile fine-admin
```

> 確認: CloudFront の URL を開き、作成したメール/パスワードでログイン → 保護画面（検索）に入れる。

---

## 8. デプロイ手順（まとめ）

```powershell
$env:AWS_PROFILE = "fine-admin"
aws sso login                      # トークン更新

cd infra
npm ci
cdk diff   -c env=dev              # 変更差分の確認（重要）
cdk deploy -c env=dev --all        # 全スタックをデプロイ
```

- **`cdk diff`** で「何が作られる/変わる」を必ず確認してから `deploy`。
- 出力（Outputs）に **CloudFront URL / API URL / UserPoolId** などが表示される → 控える。

---

## 9. デプロイ後チェック（受け入れ確認）

- [ ] CloudFront URL でフロントが表示される（ログイン画面）
- [ ] Cognito ログイン → 検索画面に入れる
- [ ] インボイス番号検索が成功（国税庁 公表 Web-API 連携 → 結果表示）
- [ ] 整合性チェック（CSV アップロード）が動作
- [ ] API Gateway 経由のヘルスチェックが 200
- [ ] Aurora が休止→復帰しても正常応答（初回数秒のコールドスタート許容）
- [ ] CloudWatch にログ出力、**機微情報が出ていない**
- [ ] ダーク/ライトテーマ切替が動作（[DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 準拠）

---

## 10. コスト管理（運用）

- **予算アラート**（[aws-account-setup.md](aws-account-setup.md) STEP3）が有効であること。
- **Cost Explorer**（コンソール → Billing）で日次推移を週 1 で確認。
- 想定外の発生源 TOP: ①Aurora が休止しない設定ミス（`MinCapacity` を 0 に）②CloudFront の大量配信 ③不要な dev 環境の放置。
- **dev 環境は使わない時に破棄**（STEP12）。prod は維持。

---

## 11. 更新（再デプロイ）

```powershell
cd infra
git pull                            # 最新コード取得
cdk diff   -c env=prod
cdk deploy -c env=prod --all
```

- フロントのみ変更時も `npm run build` → `cdk deploy`（BucketDeployment が S3 更新＋CloudFront Invalidation）。

---

## 12. ロールバック / 破棄

```powershell
# 直前バージョンへ戻す（コードを戻して再デプロイ）
cdk deploy -c env=prod --all

# 環境をまるごと破棄（dev のみ推奨。prod は要オーナー承認）
cdk destroy -c env=dev --all
```

> ⚠️ `destroy` は DB を含め削除します。**prod では実行しない**こと。データ保全が必要な場合はスナップショット保持設定（`RemovalPolicy`）を確認。

---

## 13. トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| `cdk bootstrap` で権限エラー | 権限不足。`AdministratorAccess` のプロファイルで実行しているか確認。 |
| `cdk deploy` が `Account ... not bootstrapped` | STEP3 のブートストラップ未実施。 |
| フロントは出るが API が CORS エラー | バックエンドの許可オリジンに CloudFront ドメインを追加（環境変数）。 |
| ログインで 401 / JWT invalid | `COGNITO_USER_POOL_ID` / `CLIENT_ID` / `REGION` の不一致。CDK Outputs と突合。 |
| 初回アクセスが数秒遅い | Aurora 0 ACU からの復帰（仕様）。頻繁アクセス用途なら `MinCapacity` を 0.5 に。 |
| `aws sso login` 後もコマンドが失敗 | `$env:AWS_PROFILE` 未設定 / トークン期限切れ。再ログイン。 |
| 想定外課金 | Budgets 通知を確認 → Cost Explorer で発生源特定 → 不要環境を `destroy`。 |

---

## 14. 用語集（抜粋）

| 用語 | 説明 |
|---|---|
| **CDK** | コードでインフラを定義・デプロイする AWS 公式ツール。 |
| **スタック** | まとめてデプロイ/削除する単位（CloudFormation）。 |
| **ブートストラップ** | CDK が使う土台リソースの初回作成。 |
| **Mangum** | FastAPI(ASGI) を Lambda で動かすアダプタ。 |
| **Data API** | Aurora へ HTTPS+SQL でアクセスする仕組み。ドライバ/VPC 不要。 |
| **ACU** | Aurora の容量単位（約 2GiB 相当）。0 で休止。 |
| **OAC** | CloudFront から S3 を安全に読む仕組み（バケットは非公開のまま）。 |
| **Invalidation** | CloudFront のキャッシュ更新。 |

---

## 変更履歴

| 版 | 日付 | 内容 |
|---|---|---|
| v0.1 | 2026-06-21 | 初版ドラフト（CDK 構成の骨子）。 |
| v0.2 | 2026-06-22 | 初心者向けに大幅詳細化。アカウント整備ガイドへの導線、各ステップの確認/想定出力、Cognito ユーザー作成、コスト管理・破棄・トラブルシュート・用語集を追加。AWS Docs で 0 ACU 自動休止・Data API/東京リージョン提供を確認。 |

> 本手順は P3（#5）で実環境にて検証し、確定コマンド・出力例・構成図・スクリーンショットを追記して **v1.0** とする。

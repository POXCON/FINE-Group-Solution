# 手順書（Runbooks）— FINE Group Solution

運用・構築・デプロイなどの**手順書**を格納するフォルダ。全システム共通の操作手順をここに集約する。
最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

## 一覧

| 手順書 | 概要 | 状態 |
|--------|------|------|
| [aws-account-setup.md](aws-account-setup.md) | **はじめての方向け**: AWS アカウント作成・MFA・予算アラート・**無料プランで請求ゼロ運用**・管理者ユーザー・CLI/CDK 導入(Windows) までをゼロから | v1.1 |
| [docker-desktop-setup.md](docker-desktop-setup.md) | **はじめての方向け**: Docker Desktop の導入〜動作確認（Lambda パッケージング用）。ライセンス・WSL2/Hyper-V・トラブルシュート付き | v1.0 |
| [aws-deployment.md](aws-deployment.md) | AWS デプロイ手順（CDK / Cognito / Lambda + API Gateway / S3 + CloudFront）。請求ゼロの仕組み・破棄・トラブルシュート・用語集付き（共通の考え方） | v0.3 |
| （システム別）[Invoice-Search/infra/README.md](../../Invoice-Search/infra/README.md) | Invoice-Search の**実デプロイ手順**（DB無し・実スタック名・SSM・Cognitoユーザー作成） | — |

> **AWS がはじめての場合の順番**:
> ① [aws-account-setup.md](aws-account-setup.md) → ② [docker-desktop-setup.md](docker-desktop-setup.md) → ③ [Invoice-Search/infra/README.md](../../Invoice-Search/infra/README.md)（実デプロイ）。
> [aws-deployment.md](aws-deployment.md) は全体の考え方・コスト管理のリファレンス。

## 運用方針
- 手順書は**コードと同じリポジトリで版管理**し、構成変更時に更新する。
- システム固有の手順は各システムの `docs/` に置き、共通手順は本フォルダに置く。
- 手順は再現可能であること（コマンド・前提・想定結果を明記）。

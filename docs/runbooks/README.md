# 手順書（Runbooks）— FINE Group Solution

運用・構築・デプロイなどの**手順書**を格納するフォルダ。全システム共通の操作手順をここに集約する。
最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

## 一覧

| 手順書 | 概要 | 状態 |
|--------|------|------|
| [aws-deployment.md](aws-deployment.md) | AWS デプロイ手順（CDK / Cognito / Aurora Serverless v2 + Data API / Lambda + API Gateway / S3 + CloudFront） | v0.1（P3 で検証・確定） |

## 運用方針
- 手順書は**コードと同じリポジトリで版管理**し、構成変更時に更新する。
- システム固有の手順は各システムの `docs/` に置き、共通手順は本フォルダに置く。
- 手順は再現可能であること（コマンド・前提・想定結果を明記）。

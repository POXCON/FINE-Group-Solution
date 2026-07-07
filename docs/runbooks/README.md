# 手順書（Runbooks）— FINE Group Solution

運用・構築・デプロイなどの**手順書**を格納するフォルダ。全システム共通の操作手順をここに集約する。
最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

## 一覧

| 手順書 | 概要 | 状態 |
|--------|------|------|
| [azure-account-setup.md](azure-account-setup.md) | **はじめての方向け**: Azure サブスクリプション作成・Entra ID アプリ登録・az CLI/azd 導入(Windows) までをゼロから | v1.0 |
| [docker-desktop-setup.md](docker-desktop-setup.md) | **はじめての方向け**: Docker Desktop の導入〜動作確認（ローカル開発・コンテナビルド用）。ライセンス・WSL2/Hyper-V・トラブルシュート付き | v1.0 |
| [azure-deployment.md](azure-deployment.md) | Azure デプロイ手順（Bicep / Entra ID / Static Web Apps + Container Apps / ACR）。実装例・破棄・トラブルシュート・用語集付き（Cognito→MSAL 移行の考え方） | v1.0 |
| （システム別）[Invoice-Search/infra/README.md](../../Invoice-Search/infra/README.md) | Invoice-Search の**実デプロイ手順**（FastAPI / Bicep / SWA + Container Apps / Entra 認証） | — |
| （参考・旧）[aws-account-setup.md](aws-account-setup.md) | （旧・AWS。Azure 移行済。参考用） | v1.1（アーカイブ） |
| （参考・旧）[aws-deployment.md](aws-deployment.md) | （旧・AWS。Azure 移行済。参考用） | v0.3（アーカイブ） |

> **Azure でのはじめての場合の順番**:
> ① [azure-account-setup.md](azure-account-setup.md) → ② [docker-desktop-setup.md](docker-desktop-setup.md) → ③ [Invoice-Search/infra/README.md](../../Invoice-Search/infra/README.md)（実デプロイ）。
> [azure-deployment.md](azure-deployment.md) は全体の考え方・Azure リソース・コスト管理のリファレンス。

## 運用方針
- 手順書は**コードと同じリポジトリで版管理**し、構成変更時に更新する。
- システム固有の手順は各システムの `docs/` に置き、共通手順は本フォルダに置く。
- 手順は再現可能であること（コマンド・前提・想定結果を明記）。

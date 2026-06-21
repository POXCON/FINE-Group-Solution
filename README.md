# FINE Group Solution

FINE グループ（飲食事業）向け各種アプリケーション／システムの **モノレポ**。
GitHub 運用・コーディング規約・開発体制を本リポジトリで統一する。

## 構成

```
FINE-Group-Solution/
├── CLAUDE.md            ← 全体統制ルール（最上位）
├── CONTRIBUTING.md      ← 貢献手順
├── docs/                ← 規約・ワークフロー・体制
├── .github/             ← Issue/PR テンプレ・CI
├── .claude/             ← Agents / Skills
└── <System>/            ← システム単位（frontend / backend / [middleend] / docs）
    └── Invoice-Search/  ← 既存システム（新標準へ移行対象）
```

## 技術スタック標準
- **Frontend**: Vite + React + TypeScript + daisyUI + TailwindCSS
- **Backend**: Python 3.12.10 + FastAPI（Pydantic v2 / SQLAlchemy 2.0）
- **Middleend**（任意）: BFF
- **Infra**: AWS（RDS PostgreSQL / Cognito / S3 / ECS or Lambda）※Azure から移行中

## ドキュメント
| 文書 | 内容 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | 全体統制ルール |
| [docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) | ブランチ戦略 |
| [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) | 開発ワークフロー |
| [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) | コーディング規約 |
| [docs/AGENT_ORCHESTRATION.md](docs/AGENT_ORCHESTRATION.md) | Agent 体制 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 貢献手順 |

## 開発の進め方（要約）
Issue 起票 → `develop-<system>` から `feature/bug` 作成 → TDD 実装 → 品質ゲート → PR → PM レビュー → マージ。
PM（Claude）主導で frontend / backend / qa の Managed Agents に委任し、結果は PM が必ずレビューする。

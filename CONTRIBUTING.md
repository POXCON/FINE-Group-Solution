# コントリビューションガイド — FINE Group Solution

本リポジトリ（モノレポ）への貢献手順。全体ルールは [`CLAUDE.md`](CLAUDE.md) を参照。

## 前提
- すべての作業は **GitHub Issue** に紐づける（Issue 無しの着手禁止）。
- 技術スタック・規約は [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) に従う。

## 手順（概要）
1. **Issue 起票** — `.github/ISSUE_TEMPLATE/` のテンプレ（feature / bug / task）。
2. **ブランチ作成** — `develop-<system>` 起点に `feature-<issue>` / `bug-<issue>`。
   → スキル `start-task` を利用。
3. **調査・再利用** — 既存実装・ライブラリ・公式 docs を先に確認。
4. **TDD 実装** — RED → GREEN → REFACTOR、カバレッジ 80%+。
5. **セルフ品質ゲート** — Lint / Test / Build をグリーンに。
6. **PR 作成** — `feature/bug → develop-<system>`（担当者作成）。テンプレに沿い `Closes #<issue>`。
   → スキル `finish-task` を利用。
7. **PM レビュー** — CRITICAL/HIGH は修正必須。差戻し対応。

## ブランチ・PR 権限
| PR | 作成者 |
|----|--------|
| `feature/bug → develop-<system>` | 開発者 |
| `develop-<system> → develop` | PM |
| `develop → main` | PM（オーナー確認後） |

詳細は [`docs/BRANCHING_STRATEGY.md`](docs/BRANCHING_STRATEGY.md) / [`docs/DEVELOPMENT_WORKFLOW.md`](docs/DEVELOPMENT_WORKFLOW.md)。

## コミット規約
```
<type>: <要約>   （feat|fix|refactor|docs|test|chore|perf|ci）

Refs: #<issue>
```

## 新システムの追加
スキル `new-system` を利用（scaffold → `develop-<slug>` 作成 → 固有 CLAUDE.md → ラベル追加）。

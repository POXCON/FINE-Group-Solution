# 開発ワークフロー — FINE Group Solution

最上位ルールは [`/CLAUDE.md`](../CLAUDE.md)、ブランチは [`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md) を参照。

## 全体パイプライン

```
Issue 起票 → ブランチ作成 → 調査・再利用 → TDD 実装 → セルフ品質ゲート
→ PR 作成 → PM レビュー → マージ → Issue クローズ
```

### 0. 調査・再利用（新規実装の前に必須）
- GitHub コード検索（`gh search repos` / `gh search code`）で既存実装・テンプレを探索。
- 公式ドキュメント（Context7 / ベンダ docs）で API 挙動・バージョン差異を確認。
- npm / PyPI 等のレジストリを確認し、実績あるライブラリを自作より優先。
- 80% 以上を満たす OSS があれば移植・ラップを検討。

### 1. Issue 起票
- `.github/ISSUE_TEMPLATE/` のテンプレで起票（feature / bug / task）。
- ラベル付与: `system:<slug>` / `type:feature|bug` / `priority:*`。

### 2. ブランチ作成
- `develop-<system>` を最新化し、そこから `feature-<issue>` / `bug-<issue>` を作成。

### 3. 実装（TDD 必須）
- **RED**: 失敗するテストを先に書く → **GREEN**: 最小実装で通す → **REFACTOR**: 改善。
- カバレッジ **80%+**。不変性・小さな関数・明示的エラーハンドリングを徹底。

### 4. セルフ品質ゲート（PR 前）
- フロント: `npm run lint && npm run test && npm run build`
- バック: `ruff check . && black --check . && mypy . && pytest --cov`
- CI グリーン・コンフリクト解消・ターゲット最新化を確認。

### 5. PR 作成
- `feature/bug → develop-<system>` の PR は**担当エンジニア（Agent）が作成**。
- テンプレ（`.github/PULL_REQUEST_TEMPLATE.md`）に沿って、変更概要・テスト計画・`Closes #<issue>` を記載。

### 6. PM コードレビュー（必須）
- **実装完了ごとに PM が必ずレビュー**。`code-reviewer` / `security-reviewer` / 言語別 reviewer を活用。
- CRITICAL / HIGH はマージ前修正必須。問題・非効率があれば**差戻し**。

### 7. マージ・クローズ
- Squash merge → 作業ブランチ削除 → Issue 自動クローズ。
- `develop-<system> → develop`、`develop → main` の昇格 PR は PM が実施。

---

## Invoice-Search 移行（新標準への段階移行）

既存 `Invoice-Search`（React18 + antd + MUI / FastAPI / Azure）を新標準へ移行する。

| フェーズ | 内容 |
|----------|------|
| P0: 現状把握 | 機能棚卸し・依存関係・Azure 連携箇所の洗い出し（Issue 化）。 |
| P1: バック | FastAPI 構成を Python 3.12.10 標準へ整備、Pydantic v2 / 型・テスト導入、Azure→AWS 接続層を抽象化。 |
| P2: フロント | Vite + React + TypeScript + daisyUI + Tailwind へ刷新（antd/MUI 置換）。 |
| P3: インフラ | Azure → AWS（RDS PostgreSQL / Cognito / S3）へ移行。 |
| P4: 検証 | E2E・回帰テストで機能等価性を確認後、`develop` へ昇格。 |

> 各フェーズは Issue + `feature-*` ブランチで段階的に進める。一括書き換えは避ける。

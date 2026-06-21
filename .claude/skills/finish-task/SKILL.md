---
name: finish-task
description: 実装完了後に品質ゲートを通し PR を作成する。Lint/Test/Build 検証 → コミット → feature/bug → develop-<system> への PR 作成（Closes #<issue>）までを標準手順で行う。
---

# finish-task — PR 作成ワークフロー

FINE Group Solution の標準 PR 手順。最上位ルールは `/CLAUDE.md`、フローは `docs/DEVELOPMENT_WORKFLOW.md`。

## 手順

1. **セルフ品質ゲート（PR 前必須）**
   - フロント: `npm run lint && npm run test && npm run build`
   - バック: `ruff check . && black --check . && mypy . && pytest --cov`
   - 失敗があれば修正してから次へ。テストカバレッジ 80%+ を確認。

2. **コミット**
   - 規約に沿う: `<type>: <要約>` 本文に `Refs: #<issue>`。
   - デバッグ出力・秘密情報が残っていないか確認。

3. **プッシュ**
   ```
   git push -u origin <branch>
   ```

4. **PR 作成（担当エンジニアが作成）**
   - ベース: `develop-<system-slug>` / 比較: `feature-<issue>` or `bug-<issue>`。
   - テンプレ（`.github/PULL_REQUEST_TEMPLATE.md`）に沿って変更概要・テスト計画を記載。
   - 本文に `Closes #<issue番号>` を含める。
   - `gh pr create --base develop-<system-slug> --fill`

5. **レビュー依頼**
   - PM へレビュー依頼。CRITICAL/HIGH 指摘は修正必須、差戻し対応。

## 昇格 PR（PM が実施）
- `develop-<system> → develop`、`develop → main` は PM が作成。後者はオーナー確認後マージ。

---
name: start-task
description: GitHub Issue から作業を着手する。Issue 確認 → develop-<system> 最新化 → feature-<issue>/bug-<issue> ブランチ作成までを標準手順で行う。新機能・バグ修正の着手時に使用。
---

# start-task — Issue 着手ワークフロー

FINE Group Solution の標準着手手順。最上位ルールは `/CLAUDE.md`、ブランチは `docs/BRANCHING_STRATEGY.md`。

## 手順

1. **Issue 確認**
   - 対象 Issue を取得し、種別（feature/bug）・対象システム（`system:<slug>`）・受け入れ条件を確認。
   - `gh issue view <番号>`
   - Issue が無ければ着手禁止。先に `.github/ISSUE_TEMPLATE/` で起票する。

2. **対象システムの develop ブランチを最新化**
   ```
   git fetch origin
   git switch develop-<system-slug>
   git pull origin develop-<system-slug>
   ```
   - `develop-<system-slug>` が無い場合は `new-system` スキルで作成する。

3. **作業ブランチ作成**
   - 機能追加: `git switch -c feature-<issue番号>`
   - バグ修正: `git switch -c bug-<issue番号>`
   - 任意で説明付与可: `feature-<issue番号>-<short-slug>`（先頭は必ず Issue 番号）。

4. **着手宣言**
   - Issue を In Progress（担当アサイン）にし、必要なら関連 Agent（frontend/backend/qa）へ委任。

## 完了後
実装は TDD（カバレッジ 80%+）。完了したら `finish-task` スキルで PR を作成する。

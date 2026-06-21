---
name: new-system
description: FINE Group モノレポに新システムを追加する。フォルダ scaffold（frontend/backend/任意 middleend）→ develop-<system> ブランチ作成 → システム固有 CLAUDE.md 生成 → ラベル追加までを標準手順で行う。
---

# new-system — 新システム追加ワークフロー

FINE Group Solution に新システムを追加する標準手順。最上位ルールは `/CLAUDE.md`。

## 手順

1. **slug 決定**
   - ケバブケース小文字（例: `Table-Reservation` → `table-reservation`）。

2. **フォルダ scaffold**
   ```
   <System>/
   ├── CLAUDE.md        ← root を継承、システム固有差分のみ
   ├── frontend/        ← Vite + React + TS + daisyUI + Tailwind
   ├── backend/         ← Python 3.12.10 + FastAPI
   ├── middleend/       ← 任意（BFF が必要な場合のみ）
   └── docs/
   ```
   - フロント: `npm create vite@latest`（React + TS）後に Tailwind + daisyUI を導入。
   - バック: FastAPI + Pydantic v2 雛形、`requirements.txt`、`pytest` 設定。

3. **開発ブランチ作成**
   ```
   git fetch origin
   git switch develop
   git pull origin develop
   git switch -c develop-<slug>
   git push -u origin develop-<slug>
   ```

4. **システム固有 CLAUDE.md 作成**
   - 冒頭で「root `/CLAUDE.md` を継承」と明記し、固有のコマンド・DB・特記事項のみ記載。

5. **GitHub 整備**
   - ラベル追加: `system:<slug>`。
   - 必要に応じてマイルストーン・プロジェクトボードを設定。

## 完了後
最初の機能は Issue 起票 → `start-task` で着手する。

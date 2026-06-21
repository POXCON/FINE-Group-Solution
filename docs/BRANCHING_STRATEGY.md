# ブランチ戦略 — FINE Group Solution

本書は FINE-Group-Solution モノレポにおけるブランチ運用を定義する。最上位ルールは [`/CLAUDE.md`](../CLAUDE.md) に従う。

## 1. ブランチ階層

```
main
└── develop
    ├── develop-<system-slug>
    │   ├── feature-<Issue番号>
    │   └── bug-<Issue番号>
    ├── develop-<system-slug>
    │   ├── feature-<Issue番号>
    │   └── bug-<Issue番号>
    └── develop-<system-slug>
        ├── feature-<Issue番号>
        └── bug-<Issue番号>
```

## 2. 各ブランチの役割

| ブランチ | 役割 | 直接 push | マージ元 | マージ責任者 |
|----------|------|-----------|----------|--------------|
| `main` | 本番。常にデプロイ可能。タグ付けでリリース。 | 禁止 | `develop` | PM（オーナー確認後） |
| `develop` | 全システム統合・リリース前検証。 | 禁止 | `develop-<system>` | **PM** |
| `develop-<system>` | システム単位の開発統合。 | 禁止 | `feature-*` / `bug-*` | **開発者の PR を PM が確認** |
| `feature-<issue>` | 機能追加の作業ブランチ。 | 担当者のみ | — | — |
| `bug-<issue>` | バグ修正の作業ブランチ。 | 担当者のみ | — | — |

## 3. 命名規約（厳守）

- システム識別子（slug）はケバブケース小文字。例: `Invoice-Search` → `invoice-search`。
- `develop-invoice-search` / `feature-42` / `bug-57`
- 任意で末尾に短い説明を付与可: `feature-42-csv-export`（先頭は必ず Issue 番号）。

## 4. PR フロー（誰がどの PR を出すか）

| PR | 作成者 | レビュー / 承認 |
|----|--------|------------------|
| `feature-*` / `bug-*` → `develop-<system>` | **開発者（担当エンジニア Agent）** | **PM がレビュー・承認** |
| `develop-<system>` → `develop` | **PM** | PM 自身（必要に応じオーナー確認） |
| `develop` → `main` | **PM** | **オーナー確認後マージ** |

## 5. マージ方針

- マージ方式は **Squash and merge** を基本（履歴を簡潔に保つ）。
- マージ前提条件: **CI グリーン / コンフリクト解消済み / ターゲットブランチ最新化済み**。
- マージ後は作業ブランチを削除。Issue を自動クローズ（PR 本文に `Closes #<issue>`）。

## 6. 新システム追加時

1. システムフォルダ作成（`<System>/frontend`, `/backend`, 任意 `/middleend`, `/docs`）。
2. `develop` から `develop-<system-slug>` を作成。
3. システム固有 `<System>/CLAUDE.md` を作成（root を継承）。
4. ラベル `system:<slug>` を GitHub に追加。

> 補助スキル: `.claude/skills/new-system`（新システム scaffold）, `.claude/skills/start-task`（feature/bug 着手）, `.claude/skills/finish-task`（PR 作成）。

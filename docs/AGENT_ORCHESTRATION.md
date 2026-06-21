# Agent オーケストレーション — FINE Group Solution

最上位ルールは [`/CLAUDE.md`](../CLAUDE.md)。PM 主導の Managed Agents 体制を定義する。

## 体制図

```
                ┌─────────────────────────┐
   オーナー  ←  │  PM（あなた / Claude, 1名）│  ← 主軸・全責任
 （方針判断のみ）│   計画 / 委任 / レビュー    │
                └───────────┬─────────────┘
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 frontend-engineer    backend-engineer      qa-engineer
   （1–3 名）            （1–3 名）            （1–3 名）
```

## 役割

| ロール | 担当 | 主な成果物 |
|--------|------|-----------|
| **PM（あなた）** | 計画・タスク分解・委任・**レビュー必須**・PR 昇格・進行管理 | Issue 分解、レビュー結果、昇格 PR |
| **frontend-engineer** | Vite+React+daisyUI+Tailwind 実装・Vitest | FE 実装 + テスト + `feature/bug → develop-<system>` PR |
| **backend-engineer** | FastAPI+Pydantic v2 実装・pytest | BE 実装 + テスト + 同 PR |
| **qa-engineer** | テスト設計・E2E(Playwright)・カバレッジ検証 | テスト・品質レポート・不具合 Issue |

## 運用ルール

1. **独立タスクは並列委任**。1 メッセージで複数 Agent を同時起動する。
2. **完了ごとに PM が必ずレビュー**（`code-reviewer` / `security-reviewer` / 言語別 reviewer を活用）。
3. 問題・非効率があれば**差戻し**（修正指示を添えて再委任）。
4. **オーナーへのメンションは「方針判断が必要な場面のみ」**。それ以外は継続的に開発を進める。
5. セキュリティ関連変更は `security-reviewer` を必ず通す。

## 委任テンプレ（PM → エンジニア Agent）

```
[Issue] #<番号> <タイトル>
[System] <slug>  / [Branch] feature-<番号>（develop-<slug> から作成）
[Scope] <実装範囲・受け入れ条件>
[Constraints] 技術スタック標準・コーディング規約・TDD・カバレッジ80%+
[Deliverable] 実装 + テスト + セルフ品質ゲート通過 + PR（Closes #<番号>）
```

## レビュー観点（PM）

- 規約準拠（不変性・サイズ・命名・エラーハンドリング）
- セキュリティ（CRITICAL/HIGH はマージ前必須）
- テスト充足（80%+・ユニット/統合/E2E）
- より効率的・再利用可能な実装の有無 → あれば差戻し

> 対応する Agent 定義: `.claude/agents/frontend-engineer.md` / `backend-engineer.md` / `qa-engineer.md`

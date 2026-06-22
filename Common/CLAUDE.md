# CLAUDE.md — Common（FINE Group Solution ポータル）

> 本書は **Common システム固有のルール**です。最上位ルール [`/CLAUDE.md`](../CLAUDE.md) を継承し、
> ここではシステム固有の最小差分のみを記述します。記載のない事項はすべてルートの規約に従ってください。

---

## 1. システム概要

- **システム名**: Common（FINE Group Solution ポータル）
- **目的**: FINE Group Solution の**単一入口（ポータル）**。ログイン後、利用者のロールに応じて
  各システムへの遷移カードを表示する。現時点では **インボイス番号検索カードのみ有効**、
  他カードは「準備中」表示。
- **対象**: FINE グループの店舗ユーザー／管理者。

---

## 2. 構成（本システム固有）

```
Common/
├── CLAUDE.md          ← 本書
└── frontend/          ← Vite + React + TypeScript(strict) + TailwindCSS + daisyUI
```

- backend は当面不要（認証は共有 Cognito プールを利用）。
- フロントは `Invoice-Search/frontend` の構成・認証・テーマ・デザインシステムを流用し、
  FINE デザインシステム（[`/docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md)）に準拠する。

---

## 3. 認証（本システム固有）

- **Amazon Cognito**（共有プール）を利用。env 未設定時はモック認証へフォールバック。
  - `VITE_COGNITO_USER_POOL_ID` / `VITE_COGNITO_CLIENT_ID` / `VITE_COGNITO_REGION`
- ロール判定: ID トークンの `cognito:groups` に **`fine-admin`** が含まれれば管理者。
- 「ログイン情報を記憶する」トグル: **ON=localStorage（永続）/ OFF=sessionStorage（ブラウザ閉で消去）**。
  Cognito の `CognitoUserPool({ Storage })` を切り替えて実装する。

---

## 4. 差分のないもの

ブランチ戦略・Issue 運用・コーディング規約・テスト方針・コミット規約・Agent 体制・
コードレビュー方針は、すべて [`/CLAUDE.md`](../CLAUDE.md) と `/docs` 配下に従う。

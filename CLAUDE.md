# CLAUDE.md — FINE Group Solution

> このファイルは **FINE-Group-Solution モノレポ全体**を統制する最上位の運用ルールです。
> 各システム配下の `CLAUDE.md` はこのファイルを継承し、システム固有の差分のみを記述します。
> ここに書かれた指示は既定動作より優先されます。**必ず本書のルールに従ってください。**

---

## 1. プロジェクト概要

- **オーナー**: FINE グループ（飲食事業）
- **リポジトリ**: `POXCON/FINE-Group-Solution`（GitHub, **モノレポ**）
- **目的**: FINE グループ向け各種アプリ／システムを、統一された GitHub 運用・コーディング規約のもとで継続的に開発する。
- **ドキュメント言語**: 原則 **日本語**（技術用語・コード・識別子は英語のまま）。

---

## 2. リポジトリ構成（モノレポ）

```
FINE-Group-Solution/            ← リポジトリルート（= 01. FINE-Grp）
├── CLAUDE.md                   ← 本書（全体統制）
├── README.md
├── CONTRIBUTING.md
├── .editorconfig
├── .gitignore
├── .github/                    ← Issue/PR テンプレート・CI
├── .claude/                    ← Agents / Skills / settings
├── docs/                       ← 全体ドキュメント（規約・ワークフロー）
│
├── <System-A>/                 ← システム単位フォルダ（例: Invoice-Search）
│   ├── CLAUDE.md               ← システム固有ルール（本書を継承）
│   ├── frontend/               ← Vite + React + daisyUI + Tailwind
│   ├── backend/                ← Python 3.12.10 + FastAPI
│   ├── middleend/              ← 必要に応じた BFF / 中間層（任意）
│   └── docs/
│
└── <System-B>/ ...
```

- **1 システム = 1 トップレベルフォルダ**。システム間でコードを直接 import しない（疎結合）。
- 共有したいユーティリティが生じたら `packages/`（共有パッケージ）への切り出しを PM に相談すること。

---

## 3. 技術スタック標準

### フロントエンド
- **Vite（最新）+ React（最新, TypeScript）+ daisyUI（最新）+ TailwindCSS（最新）**
- 状態管理・データ取得は原則 TanStack Query + 軽量ストア。重い独自実装より実績あるライブラリを優先。
- UI は daisyUI コンポーネント + Tailwind ユーティリティで構築（独自 CSS は最小限）。
- **UI は全システム共通の [デザインシステム（FINE UI）](docs/DESIGN_SYSTEM.md) に必ず準拠**（色・形・タイポ・レイアウト・コンポーネントを統一）。新システムは同書「適用手順」をコピーして開始する。

### バックエンド
- **Python 3.12.10 + FastAPI**
- スキーマ検証は **Pydantic v2**。ORM は **SQLAlchemy 2.0**（必要な場合）。
- 非同期 I/O を基本とし、外部境界（API 入力・DB・外部 API）で必ずバリデーション。

### ミドルエンド（任意）
- フロントの要求に合わせた集約・整形が必要な場合のみ **BFF（Backend-for-Frontend）** を `middleend/` に設置。

### インフラ / DB（**Azure 標準・低コスト最優先**）

リージョンは **Japan East** を標準とする（Static Web Apps のみ **eastasia**）。コスト最小化を基本方針とし、以下を参照アーキテクチャとする。

**環境分離**:
- **DEV（開発・検証環境）**: 無料枠活用。公開 Ingress + Azure Entra ID 認証。Front Door なし。
- **PRD（本番環境）**: 将来の高セキュリティ要件対応（#68）。Front Door Premium + Private Link、条件付きアクセス、Entra ID P1 必須。当面は未構築。

| レイヤ | 標準（コスト最適）| 理由 / 備考 |
|--------|------------------|------------|
| **認証** | **Azure Entra ID** | 店舗ユーザー・管理者を AppRoles（`admin`/`store`/`manager`）で分類。DEV は無料。PRD は Entra ID P1（条件付きアクセス・パスキー対応予定）。 |
| **フロント配信** | **Azure Static Web Apps（Free / Standard）** | React SPA を同一オリジン `/`（ポータル）+ `/invoice-search/*` で配信。カスタムドメイン・https 無料。キャッシュ最小化で動的応答に対応。 |
| **バックエンド実行** | **Azure Container Apps** | FastAPI を Docker コンテナ化。scale-to-zero（スケール最小 0）で無使用時課金ゼロ。初回リクエスト立ち上げ〜5 秒程度（業務用途で許容）。 |
| **コンテナレジストリ** | **Azure Container Registry（Basic）** | イメージ保管・ビルド。DEV 無料枠内。 |
| **DB** | **PostgreSQL Flexible Server**（将来） / **当面は Container Apps 内メモリ** | 当面は実装簡素化のため、FastAPI の起動時にテストデータをメモリ上に展開（本番向けでない）。本格運用時は PostgreSQL Flexible Server（定常低負荷 `Standard_B1s` 〜 月額約 $8）を VNet 外から Private Endpoint で接続。VNET/NAT 不要。 |
| **ログ・監視** | **Log Analytics（DEV 無料枠）** | 30 日保持。Container Apps / Static Web Apps のログを集約。 |
| **ファイルストレージ** | **Azure Storage / Blob**（当面未使用） | 必要に応じて採用（請求書 PDF 等）。 |
| **IaC** | **Bicep（ARM Template 簡潔版）** | リソースをコード管理。デプロイ手順は [`docs/runbooks/azure-deployment.md`](docs/runbooks/azure-deployment.md)。 |

**コスト戦略**:
- **DEV 無料枠活用**: Static Web Apps Free（50 GB/月 bandwidth）+ Container Apps（180 h/月 vCore）+ Entra ID + Log Analytics 30 日 = 実質課金ゼロ。
- **PostgreSQL**: 将来定常負荷時のみ `Standard_B1s`（月額約 $8）を起動。当面未構築。
- **ストレージ**: Blob Storage は課金開始前に確認（1 GB/月程度なら無料枠内）。
- **Front Door / Private Link**: PRD 環境で必要（別途 Entra ID P1 ライセンス要）。当面 DEV のみで運用。
- **想定ベースライン（DEV）**: 月額 **0–3 USD**（ほぼ無料枠）。PRD 移行時は別途見積り。
- ※ インフラ方式の確定はシステム単位で PM 承認のうえ決定。判断に迷う場合はオーナーへエスカレーション。

> 検証環境: 現在の DEV は **個人テナント（kenta.ishii1996@outlook.jp）使い捨て**。本番用 DEV/PRD は後日別テナントで構築（予定は #68）。

---

## 4. ブランチ戦略

詳細は **[docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md)**。要点のみ:

```
main                         ← 本番。常にデプロイ可能。直接 push 禁止。
└── develop                  ← 全システム統合ブランチ。リリース前検証。
    ├── develop-<system>     ← システム別開発ブランチ（例: develop-invoice-search）
    │   ├── feature-<Issue番号>   ← 機能追加（例: feature-42）
    │   └── bug-<Issue番号>       ← バグ修正（例: bug-57）
```

- **feature/bug → develop-\<system\>** の PR: **開発者（担当エンジニア Agent）が作成**。
- **develop-\<system\> → develop** の PR: **PM（あなた）が作成・承認**。
- **develop → main** の PR: **PM が作成し、オーナー確認を経てマージ**。
- ブランチ名は厳守: `develop-<system-slug>` / `feature-<issue#>` / `bug-<issue#>`。

---

## 5. GitHub Issues によるタスク管理

- **すべてのタスクは GitHub Issues で管理**。Issue 無しの作業着手は禁止。
- Issue は `.github/ISSUE_TEMPLATE/` のテンプレ（feature / bug / task）で起票。
- ブランチ・PR・コミットは Issue 番号で必ず紐付ける（コミット末尾やコミット本文に `#<issue>`）。
- ラベルでシステム・種別・優先度を分類（例: `system:invoice-search`, `type:feature`, `priority:high`）。

---

## 6. 開発ワークフロー

詳細は **[docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)**。

1. **Issue 起票** → 2. **ブランチ作成** → 3. **調査・再利用検討**（既存実装/ライブラリ優先）
→ 4. **TDD 実装**（RED→GREEN→REFACTOR, カバレッジ 80%+）→ 5. **PR 作成**
→ 6. **PM コードレビュー** → 7. **マージ** → 8. **Issue クローズ**

---

## 7. コーディング規約

詳細は **[docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)**。要点:

- **不変性**: 既存オブジェクトを破壊的変更せず、新しいコピーを返す。
- **小さなファイル/関数**: 関数 < 50 行、ファイル < 800 行（目安 200–400 行）、ネスト ≤ 4。
- **明示的なエラーハンドリング**: 握りつぶし禁止。境界で必ず入力検証。
- **秘密情報のハードコード禁止**: 環境変数 / Secrets Manager を使用。
- **デバッグ出力の残置禁止**（`console.log` / `print` のコミット禁止）。
- フロント: ESLint + Prettier / バック: ruff + black + mypy。

---

## 8. テスト

- **最低カバレッジ 80%**。Unit / Integration / E2E の 3 層を用意。
- バック: **pytest**、フロント: **Vitest** + Testing Library、E2E: **Playwright**。
- 新機能・バグ修正は **テストファースト（TDD）** を必須とする。

---

## 9. Agent オーケストレーション（PM 主導体制）

詳細は **[docs/AGENT_ORCHESTRATION.md](docs/AGENT_ORCHESTRATION.md)**。

> **原則（厳守）: PM はコードを直接編集してはならない。**
> 機能追加・**バグ修正**・リファクタ・インフラ(CDK)・テスト・設定など **すべての実装コード**（`frontend/` `backend/` `infra/` `tests/` 等）は、必ず **frontend-engineer / backend-engineer / qa-engineer** の各エンジニア Agent へ委任する。
> PM 自身が `Write`/`Edit` で実装コードを書き換えることは禁止。**例外なし**（軽微な一行修正・緊急対応も委任する）。

- **PM（あなた / 1 名）が主軸**。実装・テストは以下の Managed Agents へ委任し、**結果は PM が必ずレビュー**:
  - `frontend-engineer`（1–3 名）/ `backend-engineer`（1–3 名）/ `qa-engineer`（1–3 名）
- 独立タスクは**並列**で委任。完了ごとに **PM がコードレビュー**し、問題・非効率があれば**差戻し**。
- **PM の作業範囲**: 計画・タスク分解・Issue 起票・委任・コードレビュー・PR 作成/マージ/昇格・**統制文書（CLAUDE.md / docs 配下の規約）維持**・デプロイ等オーケストレーション（CLI 実行）・オーナー連携。
- **オーナーへの確認は「方針判断が必要な場面のみ」** メンションする。それ以外は継続的に開発を進行する。

---

## 10. コードレビュー（PM 必須）

- **実装完了ごとに PM が必ずレビュー**。`code-reviewer` / `security-reviewer` 等の補助 Agent を活用。
- 重大度 CRITICAL / HIGH は**マージ前修正必須**。MEDIUM 以下は可能な限り対応。
- セキュリティ要素（認証・入力処理・DB クエリ・外部 API・決済）変更時は `security-reviewer` を必ず起動。

---

## 11. コミットメッセージ規約

```
<type>: <要約>      （type: feat | fix | refactor | docs | test | chore | perf | ci）

<本文（任意）>

Refs: #<issue番号>
```

---

## 12. よく使うコマンド（標準）

| 目的 | フロント (`frontend/`) | バック (`backend/`) |
|------|------------------------|---------------------|
| 依存導入 | `npm install` | `pip install -r requirements.txt` |
| 開発起動 | `npm run dev` | `uvicorn main:app --reload` |
| Lint | `npm run lint` | `ruff check . && black --check . && mypy .` |
| テスト | `npm run test` | `pytest --cov` |
| ビルド | `npm run build` | — |

> 各システムで差異がある場合は、システム配下 `CLAUDE.md` に上書き記載すること。

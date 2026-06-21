# デザインシステム — FINE Group Solution（FINE UI v1）

最上位ルールは [`/CLAUDE.md`](../CLAUDE.md)。本書は **全システム共通の UI 規格（色・形・タイポグラフィ・レイアウト・コンポーネント）** を定義する唯一の正典です。
**FINE グループの全システムは本規格に準拠**し、見た目と操作感を統一します。システム固有の追加は「拡張」として本規格を壊さない範囲で行ってください。

> 関連: [コーディング規約](CODING_STANDARDS.md) / [開発ワークフロー](DEVELOPMENT_WORKFLOW.md)
> 参照実装: `Invoice-Search/frontend`（本規格の初出・リファレンス実装）

---

## 1. 目的・適用範囲

- **目的**: 「どのシステムを開いても同じ FINE の製品だ」と感じられる一貫した UI を、低コストで再現可能にする。
- **適用**: フロントエンド標準スタック（**Vite + React + TypeScript + TailwindCSS + daisyUI**）の全システム。
- **方針**: 独自 CSS を最小化し、**daisyUI のテーマトークン**＋ Tailwind ユーティリティで表現する。色・角丸は必ずトークン（`primary` / `base-200` 等）を介して参照し、生のカラーコードを画面に直書きしない。

---

## 2. デザイン原則

1. **業務システムとしての信頼感**: 装飾過多を避け、余白・階層・コントラストで「メリハリ」を作る。
2. **役割で色を使う**: ブランドブルー＝主要アクション、ニュートラル＝副次、status 色＝状態通知のみ。色の乱用禁止。
3. **トークン・ファースト**: 色/角丸/影/余白はトークン経由。1 箇所変えれば全体に波及する状態を保つ。
4. **アクセシブル**: コントラスト比 WCAG AA 以上、フォーカスリング必須、aria 属性を欠かさない。
5. **レスポンシブ既定**: デスクトップ／モバイル両対応。サイドバーは `drawer` で折りたたむ。

---

## 3. カラートークン

daisyUI の組み込みテーマ `light` / `dark` を **ブランドパレットで上書き**して使う（テーマ名は据え置き、`data-theme="light" | "dark"`）。
配色は **ブランドブルー（信頼）＋スレート系ニュートラル（業務）＋抑えた status 色**。

### 3.1 Light（既定）

| トークン | 値 | 用途 |
|---|---|---|
| `primary` | `#1d4ed8` | 主要アクション（検索・ログイン・送信）、アクティブ強調 |
| `primary-content` | `#ffffff` | primary 上の文字 |
| `secondary` | `#475569` | 副次アクション・補助 |
| `accent` | `#0e7490` | 限定的なアクセント |
| `neutral` | `#1e293b` | サイドバー等のダークサーフェス |
| `neutral-content` | `#cbd5e1` | neutral 上の文字 |
| `base-100` | `#ffffff` | カード・前面サーフェス |
| `base-200` | `#f1f5f9` | アプリ背景 |
| `base-300` | `#e2e8f0` | ボーダー・区切り |
| `base-content` | `#0f172a` | 本文テキスト |
| `info` | `#0284c7` | 情報通知 |
| `success` | `#15803d` | 正常・登録済み・整合 |
| `warning` | `#b45309` | 注意 |
| `error` | `#b91c1c` | 異常・未登録・不整合 |

### 3.2 Dark

| トークン | 値 |
|---|---|
| `primary` | `#3b82f6` |
| `secondary` | `#64748b` |
| `accent` | `#22d3ee` |
| `neutral` | `#0b1220` |
| `neutral-content` | `#cbd5e1` |
| `base-100` | `#0f172a` |
| `base-200` | `#1e293b` |
| `base-300` | `#334155` |
| `base-content` | `#e2e8f0` |
| `info` | `#38bdf8` / `success` `#22c55e` / `warning` `#f59e0b` / `error` `#f87171` |

### 3.3 形状トークン（共通）

| 変数 | 値 | 意味 |
|---|---|---|
| `--rounded-box` | `0.75rem` | カード・パネルの角丸 |
| `--rounded-btn` | `0.5rem` | ボタン・入力の角丸 |
| `--rounded-badge` | `0.375rem` | バッジの角丸 |
| `--border-btn` | `1px` | ボタンのボーダー幅 |
| `--animation-btn` / `--animation-input` | `0.2s` | トランジション |

> 影は Tailwind 拡張の `shadow-card`（カード）/ `shadow-elevated`（浮遊要素）を使用。

---

## 4. タイポグラフィ

- **欧文・数字**: `Inter` ／ **和文**: `Noto Sans JP`（Google Fonts）。フォールバックに system-ui。
- 本文の `font-feature-settings: "palt"`（和文プロポーショナル）、`letter-spacing: 0.01em`。
- **数字・コード（インボイス番号・金額等）は等幅数字** … ユーティリティ `.tabular`（`font-variant-numeric: tabular-nums`）で桁を揃える。
- 役割別ウェイト: 見出し `font-semibold`〜`font-bold`、本文 `font-normal`、補足 `text-base-content/60`。
- 見出しスケールの目安: ページ見出し `text-lg〜2xl`、セクション `text-sm font-semibold`、ラベル `text-xs uppercase tracking-wide`。

---

## 5. レイアウト標準

```
┌────────────┬─────────────────────────────────────┐
│  Sidebar   │  Topbar（sticky・ページ見出し）       │
│ (neutral)  ├─────────────────────────────────────┤
│  ブランド   │                                     │
│  ナビ       │   main（max-w-6xl 中央・p-4〜8）      │
│  ────       │     ├ カード（rounded-box/border/    │
│  ユーザー    │     │   shadow-card）                │
│  テーマ/出口 │     └ …                              │
└────────────┴─────────────────────────────────────┘
```

- **シェル**: daisyUI `drawer lg:drawer-open`。lg 以上で常時サイドバー、未満は `drawer` で開閉。
- **サイドバー**: 幅 `w-72`、`bg-neutral text-neutral-content`（ダーク）。構成は **ブランド → メニュー → スペーサ → ユーザーカード → テーマ切替/ログアウト**。
- **トップバー**: `sticky top-0`、`bg-base-100/90 backdrop-blur`、下境界 `border-base-300`。左にモバイル用ハンバーガー（`lg:hidden`）、現在ページ見出し。
- **コンテンツ**: `max-w-6xl mx-auto`、パディング `p-4 md:p-6 lg:p-8`、要素間 `gap-5`。横スクロールを発生させない。
- **モバイル**: ナビ選択時に drawer を自動クローズ。E2E でもこのフローを前提とする。

---

## 6. ナビゲーション標準

- **構成**: サイドバーにアイコン＋ラベルの縦並びメニュー。グループ見出しは `text-xs uppercase tracking-wider text-neutral-content/40`。
- **アイコン**: Heroicons（outline, `stroke-width≈1.8`, `h-5 w-5`）をインライン SVG で統一。外部アイコンライブラリは持ち込まない。
- **アクティブ表現**: `bg-primary/15 text-white`（非アクティブは `text-neutral-content/80 hover:bg-white/5`）。
- **ユーザーカード**: イニシャルの丸アバター＋メール＋状態。最下部にテーマ切替（太陽/月アイコン）とログアウト（ドアアイコン、hover で error 系）。

---

## 7. コンポーネント標準

### 7.1 ボタン（役割で階層化）

| 用途 | クラス | 例 |
|---|---|---|
| 主要 1 アクション | `btn btn-primary` | 検索・ログイン・検証 |
| 副次 | `btn btn-outline` | ダウンロード等 |
| 弱い操作 | `btn btn-ghost` | リセット・閉じる |
| 破壊的 | `btn btn-error`（または ghost + `hover:text-error`） | 削除 |

- アイコンを伴う場合は `gap-2`、処理中は `loading loading-spinner loading-sm` を前置。
- **1 画面の primary は原則 1 つ**。複数 primary を並べない。

### 7.2 カード／パネル

```html
<section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-card md:p-6">…</section>
```
- 見出し `text-lg font-semibold`＋補足 `text-sm text-base-content/60`。daisyUI 標準 `card` でなく、上記の border + shadow-card を基本形とする（影は控えめ）。

### 7.3 テーブル

- 枠付きカードで包む（ヘッダーにタイトル＋件数バッジ `badge badge-ghost`）。
- `table table-zebra`、行に `hover`。ヘッダーは `bg-base-200/70`＋`text-xs uppercase tracking-wide text-base-content/60`。
- ソート可能列はヘッダーをボタン化し、アクティブ列を `text-primary`＋▲▼で示す。
- 番号・コード列は `.tabular font-medium`。操作列は右寄せのアイコンボタン。
- 空状態は枠付きカード内に **アイコン＋説明**（`role="status"`）。

### 7.4 ステータスバッジ（ソフト）

- ネオンを避け、**アウトライン＋色ドット**で状態を示す。
- 例: `badge badge-sm badge-outline badge-success`（＋先頭に `h-1.5 w-1.5 rounded-full bg-success` のドット）。
- 意味の対応: **success=正常/登録済み/整合**、**error=異常/未登録/不整合**、無効/不明は `-` か中立表現。
- 補助ユーティリティ: `.badge-soft-success` / `.badge-soft-error` / `.badge-soft-neutral`（`index.css` 定義）。

### 7.5 フォーム

- `input input-bordered`。フォーカスは `focus:border-primary focus:ring-2 focus:ring-primary/30`。
- ラベルは `label-text font-medium`、プレースホルダで例示。エラーは `input-error`＋`aria-invalid`。
- 検証メッセージは `border border-error/25 bg-error/10 text-error` のソフト表現。

### 7.6 アラート／通知

- daisyUI `alert`（`alert-error` / `alert-info`）＋先頭アイコン。情報通知は `role="status"`、エラーは `role="alert"`。
- 軽量な注記はソフトスタイル（`border border-info/25 bg-info/10 text-info`）でも可。

### 7.7 ドロップゾーン（ファイル選択）

- `border-2 border-dashed border-base-300 bg-base-200/40`、hover で `border-primary/50 bg-primary/5`。
- 中央にアップロードアイコン＋説明。選択済みファイルは緑ドット付きピルで表示。

### 7.8 ローディング／空状態

- ローディング: `loading loading-spinner`。ボタン内処理中はラベルを「処理中表現」に切替。
- 空状態: アイコン＋簡潔な次アクション案内。`role="status"` を付与。

---

## 8. テーマ切替（Light / Dark）

- 状態は `light` / `dark` の 2 値。`document.documentElement[data-theme]` に反映し `localStorage`（キー例 `<system>.theme`）へ保存。
- **初回描画前**に `index.html` のインラインスクリプトで保存テーマを適用し、ちらつきを防止。
- 初期値は保存値 →`prefers-color-scheme` の順で決定。

---

## 9. アクセシビリティ

- コントラスト **WCAG AA 以上**（本文 4.5:1、UI 3:1）。
- すべての操作要素にフォーカスリング（`focus:ring-2 ring-primary/30` 等）。
- アイコンのみのボタンは `aria-label` 必須。装飾アイコンは `aria-hidden`。
- 状態通知は `role="status"`、エラーは `role="alert"`。キーボード操作（Enter/Space）に対応。

---

## 10. 新システムへの適用手順

新システムの `frontend/` で以下をコピーすれば本規格を即適用できる（バージョンは標準スタックに合わせる）。

### 10.1 `tailwind.config.ts`（daisyUI テーマ）

```ts
import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", '"Noto Sans JP"', "system-ui", "sans-serif"] },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        elevated: "0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    darkTheme: "dark",
    themes: [
      { light: {
        primary: "#1d4ed8", "primary-content": "#ffffff",
        secondary: "#475569", "secondary-content": "#ffffff",
        accent: "#0e7490", "accent-content": "#ffffff",
        neutral: "#1e293b", "neutral-content": "#cbd5e1",
        "base-100": "#ffffff", "base-200": "#f1f5f9", "base-300": "#e2e8f0",
        "base-content": "#0f172a",
        info: "#0284c7", success: "#15803d", warning: "#b45309", error: "#b91c1c",
        "--rounded-box": "0.75rem", "--rounded-btn": "0.5rem", "--rounded-badge": "0.375rem",
        "--border-btn": "1px", "--animation-btn": "0.2s", "--animation-input": "0.2s",
      } },
      { dark: {
        primary: "#3b82f6", "primary-content": "#ffffff",
        secondary: "#64748b", "secondary-content": "#ffffff",
        accent: "#22d3ee", "accent-content": "#0f172a",
        neutral: "#0b1220", "neutral-content": "#cbd5e1",
        "base-100": "#0f172a", "base-200": "#1e293b", "base-300": "#334155",
        "base-content": "#e2e8f0",
        info: "#38bdf8", success: "#22c55e", warning: "#f59e0b", error: "#f87171",
        "--rounded-box": "0.75rem", "--rounded-btn": "0.5rem", "--rounded-badge": "0.375rem",
        "--border-btn": "1px", "--animation-btn": "0.2s", "--animation-input": "0.2s",
      } },
    ],
  },
};
export default config;
```

### 10.2 `index.html`（フォント＋ちらつき防止）

```html
<html lang="ja" data-theme="light">
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
    <script>
      (function () {
        try {
          var s = localStorage.getItem("<system>.theme");
          var t = (s === "light" || s === "dark") ? s
            : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
          document.documentElement.setAttribute("data-theme", t);
        } catch (e) {}
      })();
    </script>
  </head>
</html>
```

### 10.3 `src/index.css`（ベース）

`@tailwind base/components/utilities` に加え、本文フォント・`.tabular`・控えめスクロールバー・`.badge-soft-*` を定義（参照実装 `Invoice-Search/frontend/src/index.css` をそのまま流用）。

### 10.4 共有レイアウト

`AppLayout`（ダークサイドバー＋トップバー＋drawer）を参照実装からポートする。将来的に共通化要望が高まれば `packages/` への切り出しを PM に相談。

---

## 11. 参照実装・関連ドキュメント

- リファレンス実装: `Invoice-Search/frontend/`（`tailwind.config.ts` / `src/index.css` / `src/app/layout/AppLayout.tsx` / 各 feature コンポーネント）
- UI/UX 監査スクリーンショット: `Invoice-Search/docs/migration/uiux-after/`
- [コーディング規約](CODING_STANDARDS.md) / [開発ワークフロー](DEVELOPMENT_WORKFLOW.md) / [ブランチ戦略](BRANCHING_STRATEGY.md)

---

## 12. 変更履歴

| バージョン | 日付 | 内容 |
|---|---|---|
| v1.0 | 2026-06-22 | 初版。Invoice-Search 刷新に基づく FINE UI 規格を制定（カラー/タイポ/レイアウト/コンポーネント）。 |

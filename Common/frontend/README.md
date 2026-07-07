# FINE Group Solution ポータル（Common / frontend）

FINE Group Solution の単一入口となるポータル画面。ログイン必須・ロール別にアプリ遷移カードを表示する。

## 技術スタック

Vite + React + TypeScript(strict) + TailwindCSS + daisyUI。FINE デザインシステム（`/docs/DESIGN_SYSTEM.md`）準拠。

## 開発

```bash
npm install
cp .env.example .env   # Entra (Azure) 値を設定。未設定ならモック認証で起動。
npm run dev
```

## コマンド

| 目的 | コマンド |
|------|----------|
| 開発起動 | `npm run dev` |
| Lint | `npm run lint` |
| テスト | `npm run test` |
| ビルド | `npm run build` |

## 認証

- Microsoft Entra ID（MSAL / `@azure/msal-browser` + `@azure/msal-react`）。`loginRedirect` / `logoutRedirect` 方式。
  env（`VITE_AZURE_*`）未設定時はモック認証へフォールバック。
- 「ログイン情報を記憶する」トグル: ON=localStorage（永続）/ OFF=sessionStorage（ブラウザ閉で消去）。
  MSAL の `cacheLocation` を切り替えて実装（切替時は `PublicClientApplication` を再生成）。
- ロール判定: ID トークンの `roles` クレームに `admin` を含めば管理者（`store` / `manager` も定数化）。

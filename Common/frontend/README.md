# FINE Group Solution ポータル（Common / frontend）

FINE Group Solution の単一入口となるポータル画面。ログイン必須・ロール別にアプリ遷移カードを表示する。

## 技術スタック

Vite + React + TypeScript(strict) + TailwindCSS + daisyUI。FINE デザインシステム（`/docs/DESIGN_SYSTEM.md`）準拠。

## 開発

```bash
npm install
cp .env.example .env   # Cognito 値を設定。未設定ならモック認証で起動。
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

- Amazon Cognito（共有プール）。env 未設定時はモック認証へフォールバック。
- 「ログイン情報を記憶する」トグル: ON=localStorage（永続）/ OFF=sessionStorage（ブラウザ閉で消去）。
  Cognito の `CognitoUserPool({ Storage })` を切り替えて実装。
- ロール判定: ID トークンの `cognito:groups` に `fine-admin` を含めば管理者。

# コーディング規約 — FINE Group Solution

最上位ルールは [`/CLAUDE.md`](../CLAUDE.md)。全システム共通の規約を定義する。

## 共通原則

- **不変性 (Immutability)**: 既存オブジェクトを破壊的に変更せず、新しいコピーを返す。
- **多数の小さなファイル > 少数の巨大ファイル**: 高凝集・低結合。機能/ドメイン単位で分割。
- **明示的なエラーハンドリング**: 握りつぶし禁止。UI 向けは分かりやすいメッセージ、サーバ側は詳細ログ。
- **境界での入力検証**: ユーザ入力・API 応答・ファイル内容を信用しない。スキーマ検証を使う。
- **秘密情報のハードコード禁止**: 環境変数 / AWS Secrets Manager。起動時に必須 Secret の存在を検証。
- **デバッグ出力の残置禁止**: `console.log` / `print` をコミットしない。

## サイズ・複雑度の目安

- 関数 **< 50 行** / ファイル **< 800 行**（目安 200–400 行）/ ネスト **≤ 4 段**。
- 深いネストは早期 return で解消。

---

## フロントエンド（Vite + React + TS + daisyUI + Tailwind）

- **TypeScript strict**。`any` 禁止（やむを得ない場合は理由をコメント）。
- 関数コンポーネント + Hooks。副作用は `useEffect` に限定し依存配列を正確に。
- UI は **daisyUI コンポーネント + Tailwind ユーティリティ**。独自 CSS は最小限。
- データ取得は TanStack Query 等を優先。fetch 直書きの散在を避ける。
- Lint/Format: **ESLint + Prettier**。`npm run lint` をグリーンに。
- ディレクトリ: `src/features/<feature>/`（components / hooks / api / types）で機能単位に整理。

## バックエンド（Python 3.12.10 + FastAPI）

- **型ヒント必須**、`mypy` でチェック。**Pydantic v2** でスキーマ定義・検証。
- ルーティングは `APIRouter` で機能別分割。ビジネスロジックは service 層へ。
- DB は **SQLAlchemy 2.0**（必要時）。クエリは**パラメータ化**（文字列連結禁止＝SQLi 防止）。
- 非同期 I/O 基本。例外は明示的にハンドリングし、適切な HTTP ステータスを返す。
- Lint/Format/Type: **ruff + black + mypy**。`pytest --cov` で 80%+。
- API レスポンスは一貫したエンベロープ（success / data / error / meta）を推奨。

## ミドルエンド（BFF, 任意）

- フロント要求に応じた集約・整形に限定。業務ロジックの重複実装を避ける。

---

## セキュリティ・チェックリスト（コミット前必須）

- [ ] 秘密情報のハードコード無し
- [ ] 全ユーザ入力を検証
- [ ] SQL はパラメータ化（インジェクション対策）
- [ ] 出力の XSS 対策（サニタイズ）/ CSRF 対策
- [ ] 認証・認可の確認 / エンドポイントのレート制限
- [ ] エラーメッセージが機微情報を漏らさない

## コミット規約

```
<type>: <要約>   （feat|fix|refactor|docs|test|chore|perf|ci）

<本文（任意）>

Refs: #<issue番号>
```

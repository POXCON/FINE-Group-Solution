# Invoice-Search 要件・機能棚卸し（P0 / #2）

> 既存実装（`develop-invoice-search` 取り込み時点）を精読し、新標準への移行に向けて機能・入出力・検証・外部依存を整理する。
> 関連: Epic #1 / Azure→AWS マッピング [`azure-to-aws-mapping.md`](azure-to-aws-mapping.md)。

## 1. システム概要
- 目的: 国税庁「適格請求書発行事業者公表システム Web-API」を用いた**インボイス番号の検索**と、**自社CSVと公表情報の整合性チェック**。
- 利用者: 店舗ごとに払い出されたユーザー（**1 日数名・同時アクセスほぼ無し**）。
- 構成: フロント（React/Vite）＋ バックエンド（FastAPI, 公表API中継）＋ Azure（認証/ログ）。

## 2. 機能一覧

| 機能 | 概要 | 入力 | 出力 | 主な検証 |
|------|------|------|------|----------|
| ダッシュボード | 各モードへの導線 | — | ナビゲーションカード | — |
| 単一検索 | インボイス番号を検索 | テキスト入力 **1 欄**（※現状1欄。state は10件で不一致） | 結果テーブル（番号/会社名/住所）、CSV DL | 13桁数字、先頭 `T` は自動付与 |
| 複数検索 | 複数番号を一括検索 | テキスト入力 **10 欄**（2列グリッド） | 結果テーブル、CSV DL | 各欄 13桁数字 |
| 整合性検索 | CSVと公表情報を突合 | CSVアップロード（列: インボイス番号/会社名/住所） | 突合テーブル（整合性・マージ）、CSV DL | `^T?\d{13}$`、10件ずつ分割リクエスト |
| 設定 | テーマ/言語/検索API | UI操作 | localStorage 保存 | 検索API選択は `webAPI` 固定（実質ダミー） |
| 認証 | ログインユーザー取得 | Azure EasyAuth `/.auth/me` | email / name | （本番のみ。dev は "Test User"） |
| ログ送信 | 操作・エラーログ | message/level/file | Azure App Insights | — |

## 3. 外部依存（国税庁 公表 Web-API）
- 環境変数: `INVOICE_APP_ID`（アプリ ID）, `INVOICE_API_URL`（エンドポイント）。
- リクエスト: `…?id=<APP_ID>&number=<カンマ区切り番号>&day=<JST日付>&type=21&history=0`（GET）。
- レスポンス: `announcement[]`（`registratedNumber` / `name` / `address` …）。
- **継続利用方針**: 国税庁 適格請求書 API を引き続き利用（オーナー確認済み）。
- 確認事項: レート制限・1リクエストあたり番号上限（現状10件分割の根拠）・公表APIのバージョン。

## 4. 移行で対応すべき既知の問題（Epic #1 と対応）
- 単一検索の入力欄が1欄のみ（`SearchBox/Single` `length:1`）→ 仕様確定（1欄/可変）必要。
- **複数検索 FE と backend のレスポンス不一致**: FE は `invoiceCheck` / `invoiceTradeName`（屋号）を参照するが backend は未返却 → 公表APIの返却項目を確認し整合（P1）。
- API エラー時に `undefined` を返し呼び出し側で `.map` クラッシュ → 型安全な結果へ。
- 認証・CORS・エラー漏洩・同期I/O 等のセキュリティ/品質問題（Epic #1 参照）。

## 5. 非機能要件（確定）
- 低稼働・低コスト最優先（DB は Aurora Serverless v2 + Data API 既定、想定 月 $5–15）。
- 多言語（ja/en）、ライト/ダークテーマ、CSV 入出力（UTF-8 BOM 付）。
- アクセシビリティ・レスポンシブ（モバイル崩壊の解消は必須）。

## 6. 移行後の機能要件（P1/P2 の前提）
- 単一/複数/整合性の各検索を新 UI（daisyUI+Tailwind）で再実装、UX 改善（可変入力・一括貼付け）。
- backend は公表API中継 + Cognito 認証 + 構造化ログ（CloudWatch）。
- 認証は Cognito（店舗ユーザー払い出し）。CSV 仕様（列・文字コード）は現行踏襲。

## 7. オープンクエスチョン（要確認）
- [ ] 単一検索は1欄/複数欄どちらを正とするか。
- [ ] 複数検索で表示する項目（屋号 `tradeName`・登録状況 `invoiceCheck` の要否）。
- [ ] 公表API のレート制限・番号上限の正確な仕様。
- [ ] 認証は Google 連携（現行ボタンあり）を Cognito の IdP として残すか。

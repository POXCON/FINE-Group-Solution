<!-- ブランチ: feature-<issue>/bug-<issue> → develop-<system>（昇格 PR は PM が作成） -->

## 概要
<!-- 何を・なぜ変更したか -->

## 関連 Issue
Closes #

## 変更種別
- [ ] feat（機能追加）
- [ ] fix（バグ修正）
- [ ] refactor / chore / docs / test / perf / ci

## 対象
- システム: `system:<slug>`
- レイヤ: [ ] frontend [ ] backend [ ] middleend [ ] infra

## テスト計画
<!-- 実施したテストと結果。カバレッジ 80%+ を確認 -->
- [ ] ユニットテスト
- [ ] 統合テスト
- [ ] E2E（該当する場合）

## セルフ品質ゲート
- [ ] Lint 通過（FE: `npm run lint` / BE: `ruff + black + mypy`）
- [ ] テスト通過（FE: `npm run test` / BE: `pytest --cov`）
- [ ] ビルド成功（FE: `npm run build`）
- [ ] デバッグ出力・秘密情報の残置なし
- [ ] ターゲットブランチ最新化・コンフリクト解消済み

## レビュー依頼事項 / 補足
<!-- PM に確認してほしい点、判断が必要な方針があれば記載 -->

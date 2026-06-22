export type CardIconName =
  | "salesReview"
  | "taxExport"
  | "invoiceSearch"
  | "salesExpenseInput"
  | "inventory";

export interface PortalCard {
  /** 安定したキー（テスト・React key 用）。 */
  id: string;
  /** i18n タイトルキー。 */
  titleKey: string;
  /** i18n 説明キー。 */
  descriptionKey: string;
  /** アイコン識別子。 */
  icon: CardIconName;
  /** 有効カードの遷移先 URL（外部）。無効カードでは undefined。 */
  href?: string;
  /** 準備中（無効）カードかどうか。 */
  comingSoon: boolean;
}

export interface PortalSection {
  /** i18n セクション見出しキー。 */
  titleKey: string;
  cards: readonly PortalCard[];
}

import type { PortalSection } from "../types";

interface BuildSectionsParams {
  isAdmin: boolean;
  /** インボイス番号検索アプリの遷移先 URL。 */
  invoiceSearchUrl: string;
}

/**
 * ロールに応じてポータルのセクション／カード一覧を構築する。
 *
 * - 管理者機能セクションは isAdmin=true のときのみ含める。
 *   インボイス番号検索のみ有効、他は準備中。
 * - 一般ユーザー機能セクションは常に含める（全カード準備中）。
 */
export function buildSections({
  isAdmin,
  invoiceSearchUrl,
}: BuildSectionsParams): readonly PortalSection[] {
  const userSection: PortalSection = {
    titleKey: "portal.userSection",
    cards: [
      {
        id: "sales-expense-input",
        titleKey: "portal.cards.salesExpenseInput.title",
        descriptionKey: "portal.cards.salesExpenseInput.description",
        icon: "salesExpenseInput",
        comingSoon: true,
      },
      {
        id: "inventory",
        titleKey: "portal.cards.inventory.title",
        descriptionKey: "portal.cards.inventory.description",
        icon: "inventory",
        comingSoon: true,
      },
    ],
  };

  if (!isAdmin) {
    return [userSection];
  }

  const adminSection: PortalSection = {
    titleKey: "portal.adminSection",
    cards: [
      {
        id: "sales-review",
        titleKey: "portal.cards.salesReview.title",
        descriptionKey: "portal.cards.salesReview.description",
        icon: "salesReview",
        comingSoon: true,
      },
      {
        id: "tax-export",
        titleKey: "portal.cards.taxExport.title",
        descriptionKey: "portal.cards.taxExport.description",
        icon: "taxExport",
        comingSoon: true,
      },
      {
        id: "invoice-search",
        titleKey: "portal.cards.invoiceSearch.title",
        descriptionKey: "portal.cards.invoiceSearch.description",
        icon: "invoiceSearch",
        href: invoiceSearchUrl,
        comingSoon: false,
      },
    ],
  };

  return [adminSection, userSection];
}

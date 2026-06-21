import { type Page, type Route } from "@playwright/test";
import type { InvoiceApiResult } from "../src/features/search/types";

/**
 * API エンドポイントのモックヘルパー。
 * page.route で **\/api/invoicesearch_webapi をインターセプトして
 * 指定した結果を返す。バックエンドの起動なしに安定した E2E を実現する。
 */
export async function mockInvoiceApi(
  page: Page,
  results: InvoiceApiResult[],
): Promise<void> {
  await page.route("**/api/invoicesearch_webapi", (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(results),
    });
  });
}

/**
 * API がエラーを返すモック。
 */
export async function mockInvoiceApiError(
  page: Page,
  status = 500,
): Promise<void> {
  await page.route("**/api/invoicesearch_webapi", (route: Route) => {
    void route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Internal Server Error" }),
    });
  });
}

/** モック認証でログインする共通ヘルパー。 */
export async function loginWithMock(
  page: Page,
  email = "test@example.com",
  password = "password123",
): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // LoginForm は state.from がなければ /dashboard へリダイレクトする
  // / → /search にリダイレクトされるため /search または /dashboard を許容
  await page.waitForURL(/\/(search|dashboard)/, { timeout: 15000 });
  // /dashboard は未定義ルートなので /search へ再ナビゲート
  if (page.url().includes("/dashboard") || page.url().includes("login")) {
    await page.goto("/search");
    await page.waitForURL(/\/search/, { timeout: 10000 });
  }
}

/** テスト用インボイス結果のフィクスチャ。 */
export const MOCK_INVOICE_RESULTS: InvoiceApiResult[] = [
  {
    invoiceNumber: "T1234567890123",
    invoiceName: "株式会社テスト",
    invoiceAddress: "東京都千代田区1-1-1",
    invoiceTradeName: "テスト商店",
    invoiceCheck: true,
  },
  {
    invoiceNumber: "T9876543210987",
    invoiceName: "有限会社サンプル",
    invoiceAddress: "大阪府大阪市2-2-2",
    invoiceTradeName: undefined,
    invoiceCheck: false,
  },
];

/** 整合性チェック用 CSV コンテンツ。 */
export const MOCK_CONSISTENCY_CSV = `インボイス番号,会社名,住所
T1234567890123,株式会社テスト,東京都千代田区1-1-1
T9876543210987,有限会社ミスマッチ,大阪府大阪市99-99-99
`;

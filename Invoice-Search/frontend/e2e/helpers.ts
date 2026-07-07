import { type Page, type Route } from "@playwright/test";
import type { InvoiceApiResult } from "../src/features/search/types";

/**
 * API エンドポイントのモックヘルパー。
 * page.route で **\/api/invoice-search をインターセプトして
 * `{ results: [...] }` を返す。バックエンドの起動なしに安定した E2E を実現する。
 */
export async function mockInvoiceApi(
  page: Page,
  results: InvoiceApiResult[],
): Promise<void> {
  await page.route("**/api/invoice-search", (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results }),
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
  await page.route("**/api/invoice-search", (route: Route) => {
    void route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Internal Server Error" }),
    });
  });
}

/** mockAuthClient がセッションを読み出す sessionStorage キー。 */
const MOCK_AUTH_STORAGE_KEY = "invoice-search.mock-auth-user";

/** vite base="/invoice-search/" 配信下のアプリ内パス。先頭スラッシュなしで base 相対解決させる。 */
export const SEARCH_PATH = "search";

/**
 * 認証済み状態を作る共通ヘルパー。
 *
 * 自前ログイン画面は廃止したため、ログイン UI を操作する代わりに
 * mockAuthClient が参照する sessionStorage へ直接モックセッションを投入する。
 * `addInitScript` でページスクリプト実行前に注入することで、アプリ初期化時の
 * `getCurrentUser()` が認証済みユーザーを返し、ProtectedRoute を通過させる。
 */
export async function loginWithMock(
  page: Page,
  email = "test@example.com",
): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.sessionStorage.setItem(key, value);
    },
    // roles に admin を含め、ロールガード（管理者専用）を通過させる。
    [MOCK_AUTH_STORAGE_KEY, JSON.stringify({ email, roles: ["admin"] })] as const,
  );
  // baseURL は .../invoice-search/ なので、先頭スラッシュなしで base 相対解決させる。
  await page.goto(SEARCH_PATH);
  await page.waitForURL(/\/invoice-search\/search/, { timeout: 15000 });
}

/**
 * 非管理者（admin ロール非保持の店舗ユーザー）のモックセッションを投入する。
 * ロールガードにより、保護ルートへ入れずポータル（`/`）へリダイレクトされる想定。
 */
export async function seedNonAdminSession(
  page: Page,
  email = "staff@example.com",
): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.sessionStorage.setItem(key, value);
    },
    [MOCK_AUTH_STORAGE_KEY, JSON.stringify({ email, roles: ["store"] })] as const,
  );
}

/**
 * モバイル幅ではサイドナビが drawer 内に隠れているため、
 * ナビゲーション操作の前にハンバーガーで drawer を開く。
 * デスクトップ（lg:drawer-open）では何もしない。
 */
export async function openSidebarIfMobile(
  page: Page,
  isMobile: boolean | undefined,
): Promise<void> {
  if (!isMobile) {
    return;
  }
  await page.locator("label[for='sidebar-toggle']").first().click();
  await page.waitForTimeout(300);
}

/** テスト用インボイス結果のフィクスチャ。 */
export const MOCK_INVOICE_RESULTS: InvoiceApiResult[] = [
  {
    invoiceNumber: "T1234567890123",
    name: "株式会社テスト",
    address: "東京都千代田区1-1-1",
    tradeName: "テスト商店",
    invoiceCheck: true,
  },
  {
    invoiceNumber: "T9876543210987",
    name: "有限会社サンプル",
    address: "大阪府大阪市2-2-2",
    tradeName: null,
    invoiceCheck: false,
  },
];

/** 整合性チェック用 CSV コンテンツ。 */
export const MOCK_CONSISTENCY_CSV = `インボイス番号,会社名,住所
T1234567890123,株式会社テスト,東京都千代田区1-1-1
T9876543210987,有限会社ミスマッチ,大阪府大阪市99-99-99
`;

import { test, expect, type Page } from "@playwright/test";
import {
  loginWithMock,
  seedNonAdminSession,
  SEARCH_PATH,
} from "./helpers";

/**
 * 認証フロー E2E テスト（SSO 統合後）
 *
 * - 自前ログイン画面は廃止。未認証/セッション無しはポータル（`/`）へ全画面リダイレクト。
 * - モックセッション投入で認証済み状態 → 保護ルートへ入れる。
 * - ログアウトはポータル側の責務（本アプリのヘッダーには存在しない）。
 *
 * NOTE: dev サーバは base="/invoice-search/" 配下のみを配信し、ポータル（`/`）は
 * 別オリジン/別配信のため存在しない。E2E ではオリジン直下 `/` をスタブ HTML で
 * 差し替え、リダイレクトが確実にポータル（`/`）へ向かうことを検証する。
 */

const PORTAL_MARKER = "PORTAL_STUB_PAGE";

/** オリジン直下 `/`（ポータル）をスタブ HTML に差し替える。 */
async function stubPortalRoot(page: Page): Promise<void> {
  await page.route("http://127.0.0.1:5173/", (route) => {
    void route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><html><body><h1>${PORTAL_MARKER}</h1></body></html>`,
    });
  });
}

test.describe("Authentication flow", () => {
  test("未認証ユーザーが /search へアクセスするとポータル（/）へリダイレクトされる", async ({
    page,
  }) => {
    await stubPortalRoot(page);
    await page.goto(SEARCH_PATH);
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
    await expect(page.getByText(PORTAL_MARKER)).toBeVisible();
  });

  test("未認証ユーザーがサブパスのルートへアクセスするとポータル（/）へリダイレクトされる", async ({
    page,
  }) => {
    await stubPortalRoot(page);
    // base 相対の空パス → /invoice-search/ （アプリのルート）
    await page.goto("");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
    await expect(page.getByText(PORTAL_MARKER)).toBeVisible();
  });

  test("認証済みでも非管理者（admin ロール非保持の店舗ユーザー）はポータル（/）へリダイレクトされる", async ({
    page,
  }) => {
    await stubPortalRoot(page);
    await seedNonAdminSession(page);
    await page.goto(SEARCH_PATH);
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
    await expect(page.getByText(PORTAL_MARKER)).toBeVisible();
  });

  test("モックセッション投入後は保護ルートに入れる", async ({ page }) => {
    await loginWithMock(page);
    await expect(page).toHaveURL(/\/invoice-search\/search/);
    // サイドバーにナビゲーションリンクが存在（i18n により日英どちらでも可）
    await expect(
      page.getByRole("link", { name: /Invoice Search|インボイス検索/i }),
    ).toBeVisible();
  });
});

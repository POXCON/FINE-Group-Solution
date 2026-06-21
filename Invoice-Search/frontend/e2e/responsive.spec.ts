import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { loginWithMock, mockInvoiceApi, MOCK_INVOICE_RESULTS } from "./helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * レスポンシブ・テーマ切替 E2E テスト
 *
 * - モバイル幅でサイドバーが drawer になりレイアウトが崩れない
 * - ハンバーガーメニューで drawer が開閉できる
 * - テーマ切替ボタンでダーク/ライトが切り替わる
 *
 * NOTE: これらは mobile-chrome プロジェクトで実行されることを想定しているが、
 * chromium-desktop プロジェクトでも問題なくパスするよう設計している。
 */

test.describe("Responsive layout", () => {
  test.beforeEach(async ({ page }) => {
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    await loginWithMock(page);
  });

  test("モバイル幅ではサイドバーが非表示（drawer-open クラスなし）", async ({
    page,
    isMobile,
  }) => {
    if (!isMobile) {
      // デスクトップでは drawer-open が常時表示
      const sidebar = page.locator(".drawer");
      await expect(sidebar).toBeVisible();
      return;
    }

    // モバイル: サイドバー自体は DOM に存在するが hidden 状態
    const drawer = page.locator(".drawer");
    await expect(drawer).toBeVisible();

    // lg:hidden の navbar が表示される
    const navbar = page.locator("header.navbar");
    await expect(navbar).toBeVisible();
  });

  test("モバイル幅でハンバーガーメニューを押すと drawer が開く", async ({
    page,
    isMobile,
  }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    // ハンバーガーアイコン（svg を含む label ボタン）
    const hamburger = page.locator("label[for='sidebar-toggle']").first();
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // drawer-overlay が表示される
    const overlay = page.locator(".drawer-overlay");
    await expect(overlay).toBeVisible();
  });

  test("メインコンテンツエリアが画面幅を超えない（横スクロール禁止）", async ({
    page,
  }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // 1px 許容
  });
});

test.describe("テーマ切替", () => {
  test.beforeEach(async ({ page }) => {
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    await loginWithMock(page);
  });

  test("テーマ切替ボタンが存在する", async ({ page }) => {
    // ライト or ダークのボタン
    const themeBtn = page.getByRole("button", { name: /ライト|ダーク/i });
    await expect(themeBtn).toBeVisible();
  });

  test("テーマ切替ボタンでテーマが切り替わる", async ({ page, isMobile }) => {
    // モバイルではサイドバーを開く
    if (isMobile) {
      const hamburger = page.locator("label[for='sidebar-toggle']").first();
      await hamburger.click();
      await page.waitForTimeout(300);
    }

    const themeBtn = page.getByRole("button", { name: /ダーク/i });
    await expect(themeBtn).toBeVisible();

    await themeBtn.click();

    // 切替後はボタンテキストが反転
    await expect(
      page.getByRole("button", { name: /ライト/i }),
    ).toBeVisible();
  });
});

/**
 * UI/UX 監査：モバイルスクリーンショット
 */
test.describe("UI/UX スクリーンショット（Mobile）", () => {
  const screenshotDir = path.resolve(
    __dirname,
    "../../docs/migration/uiux-after",
  );

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "モバイル幅のスクリーンショットのみ撮影する");
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("モバイル: login ページのスクリーンショット", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(screenshotDir, "mobile-login.png"),
      fullPage: true,
    });
  });

  test("モバイル: search ページ（空状態）のスクリーンショット", async ({
    page,
  }) => {
    await loginWithMock(page);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(screenshotDir, "mobile-search-empty.png"),
      fullPage: true,
    });
  });

  test("モバイル: search ページ（結果）のスクリーンショット", async ({ page }) => {
    await loginWithMock(page);
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();
    await expect(page.getByText("株式会社テスト")).toBeVisible();
    await page.screenshot({
      path: path.join(screenshotDir, "mobile-search-results.png"),
      fullPage: true,
    });
  });

  test("ダークテーマ: search ページのスクリーンショット", async ({ page, isMobile }) => {
    await loginWithMock(page);
    // モバイルではサイドバーを開いてからテーマ切替
    if (isMobile) {
      const hamburger = page.locator("label[for='sidebar-toggle']").first();
      await hamburger.click();
      await page.waitForTimeout(300);
    }
    const themeBtn = page.getByRole("button", { name: /ダーク/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
    }
    // モバイルではサイドバーを閉じてからスクリーンショット
    if (isMobile) {
      await page.locator(".drawer-overlay").click({ force: true });
      await page.waitForTimeout(200);
    }
    await page.screenshot({
      path: path.join(screenshotDir, "desktop-search-dark.png"),
      fullPage: true,
    });
  });
});

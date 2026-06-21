import { test, expect } from "@playwright/test";
import { loginWithMock } from "./helpers";

/**
 * 認証フロー E2E テスト
 *
 * - 未認証ユーザーは /login へリダイレクト
 * - 不正な認証情報ではエラーを表示
 * - モック認証でのログイン成功 → 保護ルートへ遷移
 * - ログアウト → /login へリダイレクト
 */

test.describe("Authentication flow", () => {
  test("未認証ユーザーが /search へアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/search");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証ユーザーが / へアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("ログインページにモックモード通知が表示される", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    // Cognito 未設定時はモック通知が表示（role="status" または alert-info クラス）
    const notice = page.locator('[role="status"], .alert-info').first();
    await expect(notice).toBeVisible();
  });

  test("無効なメールアドレスでログインするとエラーが表示される", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "not-an-email");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    const error = page.getByRole("alert");
    await expect(error).toBeVisible();
    // ログインページのままであること
    await expect(page).toHaveURL(/\/login/);
  });

  test("短すぎるパスワード（7文字）でログインするとエラーが表示される", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "short");
    await page.click('button[type="submit"]');
    const error = page.getByRole("alert");
    await expect(error).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("有効な認証情報でログインすると保護ルートに入れる", async ({ page }) => {
    await loginWithMock(page);
    await expect(page).toHaveURL(/\/search/);
    // サイドバーにナビゲーションリンクが存在（i18n により日英どちらでも可）
    await expect(
      page.getByRole("link", { name: /Invoice Search|インボイス検索/i }),
    ).toBeVisible();
  });

  test("ログアウトすると /login にリダイレクトされる", async ({ page }) => {
    await loginWithMock(page);
    await expect(page).toHaveURL(/\/search/);

    // ログアウトボタン（i18n により日英どちらでも可）
    await page.getByRole("button", { name: /Log out|ログアウト/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

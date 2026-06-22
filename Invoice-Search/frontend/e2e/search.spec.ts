import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { loginWithMock, mockInvoiceApi, mockInvoiceApiError, openSidebarIfMobile, MOCK_INVOICE_RESULTS } from "./helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 検索フロー E2E テスト
 *
 * - 1件入力 → 検索 → 結果テーブル表示（番号/会社名/住所/屋号/登録状況）
 * - 複数件入力 → 検索 → 結果テーブル
 * - 一括貼り付け（複数行）→ 行分割 → 検索 → 結果
 * - CSV ダウンロード
 * - 無効フォーマットのバリデーション
 * - API エラー時のエラーアラート
 * - 行の削除
 * - リセットボタン
 */

test.describe("Invoice Search flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    await loginWithMock(page);
  });

  test("検索ページのタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /インボイス番号検索/i }),
    ).toBeVisible();
  });

  test("1件のインボイス番号を入力して検索すると結果が表示される", async ({
    page,
  }) => {
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();

    // 結果テーブルに会社名が表示される
    await expect(page.getByText("株式会社テスト")).toBeVisible();
    await expect(page.getByText("東京都千代田区1-1-1")).toBeVisible();
    await expect(page.getByText("テスト商店")).toBeVisible();
    // 登録状況バッジ
    await expect(page.locator(".badge-success").first()).toBeVisible();
  });

  test("複数件のインボイス番号を行追加して検索すると全結果が表示される", async ({
    page,
  }) => {
    // 1行目
    const firstInput = page.getByRole("textbox").first();
    await firstInput.fill("T1234567890123");

    // 行追加
    await page.getByRole("button", { name: /行を追加/i }).click();

    // 2行目
    const secondInput = page.getByRole("textbox").nth(1);
    await secondInput.fill("T9876543210987");

    await page.getByRole("button", { name: /検索/i }).click();

    await expect(page.getByText("株式会社テスト")).toBeVisible();
    await expect(page.getByText("有限会社サンプル")).toBeVisible();
    // 未登録バッジ
    await expect(page.locator(".badge-error").first()).toBeVisible();
  });

  test("無効なフォーマット入力時はエラーアラートが表示される", async ({
    page,
  }) => {
    const input = page.getByRole("textbox").first();
    await input.fill("INVALID");
    await page.getByRole("button", { name: /検索/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/形式が無効/i);
  });

  test("入力が空の状態で検索するとエラーアラートが表示される", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /検索/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/有効なインボイス番号/i);
  });

  test("検索後にリセットボタンを押すと入力と結果がクリアされる", async ({
    page,
  }) => {
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();
    await expect(page.getByText("株式会社テスト")).toBeVisible();

    await page.getByRole("button", { name: /リセット/i }).click();

    // 結果が消えて空状態メッセージが表示
    await expect(page.getByRole("status")).toContainText(/検索結果がありません/i);
    // 入力がクリア
    await expect(page.getByRole("textbox").first()).toHaveValue("");
  });

  test("結果行の削除ボタンで行が削除される", async ({ page }) => {
    // 1件のみモックを返す設定で上書き
    await mockInvoiceApi(page, [MOCK_INVOICE_RESULTS[0]]);
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();
    await expect(page.getByText("株式会社テスト")).toBeVisible();

    // 削除ボタン（aria-label に「削除 T1234567890123」を含む）
    await page.getByRole("button", { name: /削除.*T1234567890123|delete.*T1234567890123/i }).click();

    await expect(page.getByText("株式会社テスト")).not.toBeVisible();
    // 1行しかなかったので削除後は空状態メッセージが表示される
    await expect(
      page.locator('[role="status"]').filter({ hasText: /検索結果がありません|No results yet/i }),
    ).toBeVisible();
  });

  test("CSV ダウンロードボタンで download イベントが発生する", async ({ page }) => {
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();
    await expect(page.getByText("株式会社テスト")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /ダウンロード/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("invoiceData.csv");
  });

  test("データなしで CSV ダウンロードするとエラーアラートが表示される", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /ダウンロード/i }).click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/ダウンロード可能なデータがありません/i);
  });

  test("API エラー時にエラーアラートが表示される", async ({ page }) => {
    // エラーモックで上書き
    await mockInvoiceApiError(page, 500);
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
  });

  test("一括貼り付けで複数インボイス番号が行分割される", async ({ page }) => {
    const firstInput = page.getByRole("textbox").first();
    // 改行区切りで貼り付け
    await firstInput.focus();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData("text/plain", "T1234567890123\nT9876543210987");
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      input?.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
    });

    // 2行に分割されたことを確認
    await expect(page.getByRole("textbox")).toHaveCount(2);
    await expect(page.getByRole("textbox").first()).toHaveValue("T1234567890123");
    await expect(page.getByRole("textbox").nth(1)).toHaveValue("T9876543210987");
  });
});

/**
 * UI/UX 監査用スクリーンショット撮影（Desktop）
 * docs/migration/uiux-after/ に保存
 */
test.describe("UI/UX スクリーンショット（Desktop）", () => {
  const screenshotDir = path.resolve(
    __dirname,
    "../../docs/migration/uiux-after",
  );

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!!isMobile, "デスクトップ幅のスクリーンショットのみ撮影する");
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("search ページ（空状態）のスクリーンショット", async ({ page }) => {
    await loginWithMock(page);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(screenshotDir, "desktop-search-empty.png"),
      fullPage: true,
    });
  });

  test("search ページ（結果表示）のスクリーンショット", async ({ page }) => {
    await loginWithMock(page);
    const input = page.getByRole("textbox").first();
    await input.fill("T1234567890123");
    await page.getByRole("button", { name: /検索/i }).click();
    await expect(page.getByText("株式会社テスト")).toBeVisible();
    await page.screenshot({
      path: path.join(screenshotDir, "desktop-search-results.png"),
      fullPage: true,
    });
  });

  test("consistency-check ページ（空状態）のスクリーンショット", async ({
    page,
    isMobile,
  }) => {
    await loginWithMock(page);
    await openSidebarIfMobile(page, isMobile);
    await page.getByRole("link", { name: /整合性チェック/i }).click();
    await page.waitForURL(/\/consistency-check/);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(screenshotDir, "desktop-consistency-check-empty.png"),
      fullPage: true,
    });
  });
});

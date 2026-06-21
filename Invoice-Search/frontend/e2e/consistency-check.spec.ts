import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { loginWithMock, mockInvoiceApi, openSidebarIfMobile, MOCK_INVOICE_RESULTS, MOCK_CONSISTENCY_CSV } from "./helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 整合性チェック E2E テスト
 *
 * - CSV アップロード → 検証ボタン → 結果テーブル表示
 * - 整合性あり/なしのバッジ表示
 * - マージボタンで会社名が API 値に更新される
 * - ファイル未選択で検証するとエラー
 */

test.describe("Consistency Check flow", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    await loginWithMock(page);

    // 整合性チェックページへ移動（モバイルは drawer を開いてから）
    await openSidebarIfMobile(page, isMobile);
    await page.getByRole("link", { name: /整合性チェック/i }).click();
    await page.waitForURL(/\/consistency-check/);
  });

  test("整合性チェックページのタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /整合性チェック/i }),
    ).toBeVisible();
  });

  test("空状態メッセージが表示される", async ({ page }) => {
    await expect(page.getByRole("status")).toContainText(
      /CSVファイルをアップロードして/i,
    );
  });

  test("ファイル未選択で検証するとエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: /検証/i }).click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/ファイルを選択/i);
  });

  test("CSV をアップロードして検証すると結果テーブルが表示される", async ({
    page,
  }) => {
    // CSV ファイルを一時ファイルとして用意
    const tmpDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const csvPath = path.join(tmpDir, "test-consistency.csv");
    fs.writeFileSync(csvPath, MOCK_CONSISTENCY_CSV, "utf-8");

    // ファイル input に CSV をセット
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // ファイル名が表示される
    await expect(page.getByText(/test-consistency\.csv/i)).toBeVisible();

    // 検証ボタンをクリック
    await page.getByRole("button", { name: /検証/i }).click();

    // 結果テーブルに行が表示される
    await expect(page.getByText("T1234567890123")).toBeVisible();
    await expect(page.getByText("T9876543210987")).toBeVisible();

    // 整合性あり: 株式会社テスト（CSV と API が一致）
    await expect(page.locator(".badge-success").first()).toBeVisible();
    // 整合性なし: 有限会社ミスマッチ（CSV と API 不一致）
    await expect(page.locator(".badge-error").first()).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test("マージボタンで不整合行が整合性あり状態に更新される", async ({ page }) => {
    const tmpDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const csvPath = path.join(tmpDir, "test-merge.csv");
    fs.writeFileSync(csvPath, MOCK_CONSISTENCY_CSV, "utf-8");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole("button", { name: /検証/i }).click();

    // マージボタンが存在する行（整合性なし）
    const mergeBtn = page.getByRole("button", { name: /マージ/i }).first();
    await expect(mergeBtn).toBeVisible();
    await mergeBtn.click();

    // マージ後はボタンが非表示になる（整合状態に変わる）
    await expect(page.getByRole("button", { name: /マージ/i })).not.toBeVisible();

    fs.unlinkSync(csvPath);
  });
});

/**
 * UI/UX 監査用スクリーンショット（整合性チェック結果）
 */
test.describe("UI/UX スクリーンショット（整合性チェック）", () => {
  const screenshotDir = path.resolve(
    __dirname,
    "../../docs/migration/uiux-after",
  );

  test("consistency-check 結果表示のスクリーンショット", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "デスクトップ幅のスクリーンショットのみ撮影する");
    await mockInvoiceApi(page, MOCK_INVOICE_RESULTS);
    await loginWithMock(page);
    await openSidebarIfMobile(page, isMobile);
    await page.getByRole("link", { name: /整合性チェック/i }).click();
    await page.waitForURL(/\/consistency-check/);

    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const tmpDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const csvPath = path.join(tmpDir, "ss-consistency.csv");
    fs.writeFileSync(csvPath, MOCK_CONSISTENCY_CSV, "utf-8");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole("button", { name: /検証/i }).click();
    await expect(page.getByText("T1234567890123")).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotDir, "desktop-consistency-check-results.png"),
      fullPage: true,
    });

    fs.unlinkSync(csvPath);
  });
});

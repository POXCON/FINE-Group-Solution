import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for Invoice-Search frontend.
 *
 * - webServer: `vite dev` を自動起動（バックエンドは起動せず page.route でモック）
 * - Chromium 中心 + モバイル viewport プロジェクト
 * - スクリーンショット: 失敗時のみ（UI/UX監査用は各テストで明示的に撮影）
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // vite base="/invoice-search/" に合わせ、E2E も同サブパスを起点にする。
    baseURL: "http://127.0.0.1:5173/invoice-search/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    // 日本語ロケール設定（i18n が navigator.language を使って言語を検出するため）
    locale: "ja-JP",
  },

  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],

  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      // Cognito 未設定 → mockAuthClient が使われる
      VITE_API_BASE_URL: "http://127.0.0.1:5173",
    },
  },
});

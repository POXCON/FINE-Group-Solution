/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 同一オリジン統合: Invoice-Search は /invoice-search/ サブパスで配信する。
  base: "/invoice-search/",
  plugins: [react()],
  // amazon-cognito-identity-js が参照する Node.js グローバル `global` をポリフィル
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["node_modules", "dist", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.ts",
        "**/*.test.tsx",
        "src/main.tsx",
        "src/App.tsx",
        "src/app/",
        "src/features/consistency-check/components/",
        "src/features/search/components/SearchPage.tsx",
        "src/shared/lib/i18n/",
        "src/shared/lib/queryClient.ts",
        "src/features/auth/api/authClient.ts",
        "src/features/auth/api/cognitoAuthClient.ts",
        "src/features/auth/components/AuthProvider.tsx",
        "src/features/auth/types/index.ts",
        "src/features/consistency-check/hooks/",
        "src/features/search/types/",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});

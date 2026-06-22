/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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
    exclude: ["node_modules", "dist"],
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
        "src/shared/lib/i18n/",
        "src/shared/lib/queryClient.ts",
        "src/features/auth/api/authClient.ts",
        "src/features/auth/api/cognitoAuthClient.ts",
        "src/features/auth/components/AuthProvider.tsx",
        "src/features/auth/components/LoginPage.tsx",
        "src/features/auth/components/LoginForm.tsx",
        "src/features/auth/types/index.ts",
        "src/features/portal/types/index.ts",
        "src/features/portal/components/PortalHeader.tsx",
        "src/features/portal/components/PortalPage.tsx",
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

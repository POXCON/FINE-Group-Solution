import type { Config } from "tailwindcss";
import daisyui from "daisyui";

/**
 * FINE Group デザインシステム v1
 * 全システム共通のカラートークン / 角丸 / フォントを定義する。
 * daisyUI の組み込みテーマ light / dark をブランドパレットで上書きしている。
 * （テーマ名を据え置くことで既存の ThemeContext / テストへ影響を与えない）
 * 規格の詳細は docs/DESIGN_SYSTEM.md を参照。
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          '"Noto Sans JP"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        elevated:
          "0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        light: {
          primary: "#1d4ed8",
          "primary-content": "#ffffff",
          secondary: "#475569",
          "secondary-content": "#ffffff",
          accent: "#0e7490",
          "accent-content": "#ffffff",
          neutral: "#1e293b",
          "neutral-content": "#cbd5e1",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "base-content": "#0f172a",
          info: "#0284c7",
          "info-content": "#ffffff",
          success: "#15803d",
          "success-content": "#ffffff",
          warning: "#b45309",
          "warning-content": "#ffffff",
          error: "#b91c1c",
          "error-content": "#ffffff",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.375rem",
          "--border-btn": "1px",
          "--tab-radius": "0.5rem",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
        },
      },
      {
        dark: {
          primary: "#3b82f6",
          "primary-content": "#ffffff",
          secondary: "#64748b",
          "secondary-content": "#ffffff",
          accent: "#22d3ee",
          "accent-content": "#0f172a",
          neutral: "#0b1220",
          "neutral-content": "#cbd5e1",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#e2e8f0",
          info: "#38bdf8",
          "info-content": "#0f172a",
          success: "#22c55e",
          "success-content": "#0f172a",
          warning: "#f59e0b",
          "warning-content": "#0f172a",
          error: "#f87171",
          "error-content": "#0f172a",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.375rem",
          "--border-btn": "1px",
          "--tab-radius": "0.5rem",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
        },
      },
    ],
    darkTheme: "dark",
  },
};

export default config;

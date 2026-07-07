import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { AuthContext } from "@/features/auth/hooks/useAuthContext";
import type { AuthContextValue } from "@/features/auth/hooks/useAuthContext";
import { ThemeContext } from "@/shared/lib/theme/ThemeContext";
import type { ThemeContextValue } from "@/shared/lib/theme/ThemeContext";
import type { AuthUser } from "@/features/auth/types";

const mockI18n = { t: (key: string) => key };
vi.mock("react-i18next", () => ({
  useTranslation: () => mockI18n,
}));

function makeAuth(user: AuthUser | null, overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user,
    isInitializing: false,
    isAuthenticating: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

function makeTheme(overrides: Partial<ThemeContextValue> = {}): ThemeContextValue {
  return {
    theme: "light",
    toggleTheme: vi.fn(),
    ...overrides,
  };
}

function renderLayout(auth: AuthContextValue, theme: ThemeContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <ThemeContext.Provider value={theme}>
        <MemoryRouter initialEntries={["/search"]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/search" element={<div>Search Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>,
  );
}

describe("AppLayout", () => {
  const adminUser: AuthUser = { email: "admin@example.com", roles: ["admin"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the back-to-portal link in the sidebar pointing to /", () => {
    renderLayout(makeAuth(adminUser), makeTheme());
    const link = screen.getByRole("link", { name: "common.backToPortal" });
    expect(link.getAttribute("href")).toBe("/");
  });

  it("does not render a logout control in the header (logout lives in the portal)", () => {
    renderLayout(makeAuth(adminUser), makeTheme({ theme: "light" }));
    expect(screen.queryByRole("button", { name: "common.logout" })).toBeNull();
  });

  it("shows the theme control in the header", () => {
    renderLayout(makeAuth(adminUser), makeTheme({ theme: "light" }));
    // light theme → label is the dark-switch action
    expect(screen.getByRole("button", { name: "common.dark" })).toBeDefined();
  });

  it("shows the light-switch label when the theme is dark", () => {
    renderLayout(makeAuth(adminUser), makeTheme({ theme: "dark" }));
    expect(screen.getByRole("button", { name: "common.light" })).toBeDefined();
  });

  it("invokes toggleTheme when the theme button is clicked", () => {
    const toggleTheme = vi.fn();
    renderLayout(makeAuth(adminUser), makeTheme({ toggleTheme }));
    fireEvent.click(screen.getByRole("button", { name: "common.dark" }));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("prefers the user name over the email local part", () => {
    const named: AuthUser = { email: "u@example.com", name: "山田 太郎", roles: [] };
    renderLayout(makeAuth(named), makeTheme());
    expect(screen.getByText("山田 太郎")).toBeDefined();
  });

  it("falls back to the email local part when no name is present", () => {
    renderLayout(makeAuth(adminUser), makeTheme());
    expect(screen.getByText("admin")).toBeDefined();
  });

  it("renders navigation links in the sidebar", () => {
    renderLayout(makeAuth(adminUser), makeTheme());
    expect(screen.getByRole("link", { name: "nav.search" })).toBeDefined();
    expect(screen.getByRole("link", { name: "nav.consistencyCheck" })).toBeDefined();
  });
});

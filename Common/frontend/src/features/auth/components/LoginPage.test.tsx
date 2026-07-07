import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthContext } from "../hooks/useAuthContext";
import type { AuthContextValue } from "../hooks/useAuthContext";

const mockI18n = { t: (key: string) => key };
vi.mock("react-i18next", () => ({
  useTranslation: () => mockI18n,
}));

function makeAuthContext(
  overrides: Partial<AuthContextValue>,
): AuthContextValue {
  return {
    user: null,
    isInitializing: false,
    isAuthenticating: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

function renderLogin(
  authValue: AuthContextValue,
  initialEntry: { pathname: string; state?: unknown } = { pathname: "/login" },
) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Portal Home</div>} />
          <Route path="/search" element={<div>Search Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("LoginPage", () => {
  it("shows a loading spinner while auth is initializing", () => {
    renderLogin(makeAuthContext({ isInitializing: true }));
    expect(screen.getByLabelText("common.loading")).toBeDefined();
  });

  it("redirects an authenticated user to the portal home", () => {
    renderLogin(
      makeAuthContext({
        user: { email: "user@test.com", roles: [] },
        isInitializing: false,
      }),
    );
    expect(screen.getByText("Portal Home")).toBeDefined();
  });

  it("redirects an authenticated user back to the originating route", () => {
    renderLogin(
      makeAuthContext({
        user: { email: "user@test.com", roles: [] },
        isInitializing: false,
      }),
      { pathname: "/login", state: { from: { pathname: "/search" } } },
    );
    expect(screen.getByText("Search Page")).toBeDefined();
  });

  it("renders the login panel when the user is not authenticated", () => {
    renderLogin(makeAuthContext({ user: null, isInitializing: false }));
    expect(screen.getByText("auth.loginTitle")).toBeDefined();
  });
});

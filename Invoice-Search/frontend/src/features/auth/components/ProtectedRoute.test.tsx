import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthContext } from "../hooks/useAuthContext";
import type { AuthContextValue } from "../hooks/useAuthContext";

const mockI18n = { t: (key: string) => key };
vi.mock("react-i18next", () => ({
  useTranslation: () => mockI18n,
}));

function makeAuthContext(overrides: Partial<AuthContextValue>): AuthContextValue {
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

function renderWithRoute(authValue: AuthContextValue, initialPath = "/protected") {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    // window.location.href への代入を観測できるようモック化する。
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...window.location, href: originalHref },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading spinner when initializing", () => {
    const auth = makeAuthContext({ isInitializing: true });
    renderWithRoute(auth);
    expect(screen.getByLabelText("common.loading")).toBeDefined();
  });

  it("redirects to the portal (/) when user is not authenticated", () => {
    const auth = makeAuthContext({ user: null, isInitializing: false });
    renderWithRoute(auth);
    expect(window.location.href).toBe("/");
  });

  it("does not redirect while initializing", () => {
    const auth = makeAuthContext({ user: null, isInitializing: true });
    renderWithRoute(auth);
    expect(window.location.href).toBe(originalHref);
  });

  it("renders protected content when user is authenticated", () => {
    const auth = makeAuthContext({ user: { email: "user@test.com" }, isInitializing: false });
    renderWithRoute(auth);
    expect(screen.getByText("Protected Content")).toBeDefined();
  });

  it("does not redirect when user is authenticated", () => {
    const auth = makeAuthContext({ user: { email: "user@test.com" }, isInitializing: false });
    renderWithRoute(auth);
    expect(window.location.href).toBe(originalHref);
  });
});

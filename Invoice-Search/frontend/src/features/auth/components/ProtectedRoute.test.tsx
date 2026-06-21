import { describe, it, expect, vi } from "vitest";
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
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("shows loading spinner when initializing", () => {
    const auth = makeAuthContext({ isInitializing: true });
    renderWithRoute(auth);
    expect(screen.getByLabelText("common.loading")).toBeDefined();
  });

  it("redirects to login when user is not authenticated", () => {
    const auth = makeAuthContext({ user: null, isInitializing: false });
    renderWithRoute(auth);
    expect(screen.getByText("Login Page")).toBeDefined();
  });

  it("renders protected content when user is authenticated", () => {
    const auth = makeAuthContext({ user: { email: "user@test.com" }, isInitializing: false });
    renderWithRoute(auth);
    expect(screen.getByText("Protected Content")).toBeDefined();
  });
});

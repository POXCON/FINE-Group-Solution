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
  it("shows a loading spinner while initializing", () => {
    renderWithRoute(makeAuthContext({ isInitializing: true }));
    expect(screen.getByLabelText("common.loading")).toBeDefined();
  });

  it("redirects to login when the user is not authenticated", () => {
    renderWithRoute(makeAuthContext({ user: null, isInitializing: false }));
    expect(screen.getByText("Login Page")).toBeDefined();
  });

  it("renders protected content when the user is authenticated", () => {
    renderWithRoute(
      makeAuthContext({
        user: { email: "user@test.com", roles: [] },
        isInitializing: false,
      }),
    );
    expect(screen.getByText("Protected Content")).toBeDefined();
  });
});

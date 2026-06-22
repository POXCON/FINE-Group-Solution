import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./ThemeContext";
import { useTheme } from "./useTheme";

function ThemeDisplay() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeDisplay />
    </ThemeProvider>,
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.restoreAllMocks();
  });

  it("provides default light theme when no preference stored", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    renderWithTheme();
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("uses stored theme from localStorage", () => {
    localStorage.setItem("fine-portal.theme", "dark");
    renderWithTheme();
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("sets data-theme attribute on documentElement", () => {
    localStorage.setItem("fine-portal.theme", "light");
    renderWithTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggles theme when toggleTheme is called", async () => {
    localStorage.setItem("fine-portal.theme", "light");
    renderWithTheme();

    const toggleButton = screen.getByRole("button", { name: "Toggle" });
    await userEvent.click(toggleButton);

    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("persists theme to localStorage when toggled", async () => {
    localStorage.setItem("fine-portal.theme", "light");
    renderWithTheme();

    const toggleButton = screen.getByRole("button", { name: "Toggle" });
    await userEvent.click(toggleButton);

    expect(localStorage.getItem("fine-portal.theme")).toBe("dark");
  });

  it("detects dark mode preference", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    renderWithTheme();
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });
});

describe("useTheme", () => {
  it("throws when used outside ThemeProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    function BrokenComponent() {
      useTheme();
      return null;
    }
    expect(() => render(<BrokenComponent />)).toThrow(
      "useTheme must be used within a ThemeProvider",
    );
    consoleError.mockRestore();
  });
});

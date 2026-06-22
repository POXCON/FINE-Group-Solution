import { describe, it, expect, beforeEach } from "vitest";
import { createMockAuthClient } from "./mockAuthClient";

describe("createMockAuthClient", () => {
  let client: ReturnType<typeof createMockAuthClient>;

  beforeEach(() => {
    sessionStorage.clear();
    client = createMockAuthClient();
  });

  describe("login", () => {
    it("resolves with user for valid credentials", async () => {
      const user = await client.login({ email: "test@example.com", password: "password123" });
      expect(user).toEqual({ email: "test@example.com", groups: ["fine-admin"] });
    });

    it("includes fine-admin group so dev/E2E users pass the role guard", async () => {
      const user = await client.login({ email: "test@example.com", password: "password123" });
      expect(user.groups).toContain("fine-admin");
    });

    it("persists groups in sessionStorage", async () => {
      await client.login({ email: "test@example.com", password: "password123" });
      const stored = sessionStorage.getItem("invoice-search.mock-auth-user");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}").groups).toEqual(["fine-admin"]);
    });

    it("rejects for invalid email format", async () => {
      await expect(
        client.login({ email: "not-an-email", password: "password123" }),
      ).rejects.toThrow("Invalid email or password.");
    });

    it("rejects for password shorter than 8 characters", async () => {
      await expect(
        client.login({ email: "test@example.com", password: "short" }),
      ).rejects.toThrow("Invalid email or password.");
    });

    it("stores user in sessionStorage after login", async () => {
      await client.login({ email: "test@example.com", password: "password123" });
      const stored = sessionStorage.getItem("invoice-search.mock-auth-user");
      expect(stored).not.toBeNull();
    });
  });

  describe("logout", () => {
    it("resolves without error", async () => {
      await expect(client.logout()).resolves.toBeUndefined();
    });

    it("removes user from sessionStorage", async () => {
      await client.login({ email: "test@example.com", password: "password123" });
      await client.logout();
      const stored = sessionStorage.getItem("invoice-search.mock-auth-user");
      expect(stored).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when not logged in", async () => {
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
    });

    it("returns user with groups after login", async () => {
      await client.login({ email: "test@example.com", password: "password123" });
      const user = await client.getCurrentUser();
      expect(user).toEqual({ email: "test@example.com", groups: ["fine-admin"] });
    });

    it("restores legacy stored users (without groups) as fine-admin", async () => {
      sessionStorage.setItem(
        "invoice-search.mock-auth-user",
        JSON.stringify({ email: "legacy@example.com" }),
      );
      const user = await client.getCurrentUser();
      expect(user).toEqual({ email: "legacy@example.com", groups: ["fine-admin"] });
    });

    it("returns null when stored JSON has no email", async () => {
      sessionStorage.setItem("invoice-search.mock-auth-user", JSON.stringify({ groups: [] }));
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
    });

    it("returns null after logout", async () => {
      await client.login({ email: "test@example.com", password: "password123" });
      await client.logout();
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
    });

    it("returns null when sessionStorage has invalid JSON", async () => {
      sessionStorage.setItem("invoice-search.mock-auth-user", "invalid-json");
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});

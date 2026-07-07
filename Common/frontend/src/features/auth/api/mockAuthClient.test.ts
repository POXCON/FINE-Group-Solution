import { describe, it, expect, beforeEach } from "vitest";
import { createMockAuthClient } from "./mockAuthClient";
import { ROLE_ADMIN } from "../lib/roles";

const STORAGE_KEY = "fine-portal.mock-auth-user";

describe("createMockAuthClient", () => {
  let client: ReturnType<typeof createMockAuthClient>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    client = createMockAuthClient();
  });

  describe("login", () => {
    it("resolves with a non-admin user for a plain email", async () => {
      const user = await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      });
      expect(user).toEqual({ email: "test@example.com", roles: [] });
    });

    it("grants admin role when email local part contains 'admin'", async () => {
      const user = await client.login({
        email: "admin@example.com",
        password: "password123",
        rememberMe: false,
      });
      expect(user.roles).toContain(ROLE_ADMIN);
    });

    it("rejects an invalid email format", async () => {
      await expect(
        client.login({
          email: "not-an-email",
          password: "password123",
          rememberMe: false,
        }),
      ).rejects.toThrow("Invalid email or password.");
    });

    it("rejects a password shorter than 8 characters", async () => {
      await expect(
        client.login({
          email: "test@example.com",
          password: "short",
          rememberMe: false,
        }),
      ).rejects.toThrow("Invalid email or password.");
    });

    it("stores the user in localStorage when rememberMe is true", async () => {
      await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("stores the user in sessionStorage when rememberMe is false", async () => {
      await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      });
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when not logged in", async () => {
      expect(await client.getCurrentUser()).toBeNull();
    });

    it("returns the user after a remembered (local) login", async () => {
      await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });
      const user = await client.getCurrentUser();
      expect(user).toEqual({ email: "test@example.com", roles: [] });
    });

    it("returns the user after a session-only login", async () => {
      await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      });
      const user = await client.getCurrentUser();
      expect(user?.email).toBe("test@example.com");
    });

    it("returns null when storage holds invalid JSON", async () => {
      // rememberMe=false の preference を設定し、その session ストレージへ不正値を入れる
      await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      });
      sessionStorage.setItem(STORAGE_KEY, "not-json");
      expect(await client.getCurrentUser()).toBeNull();
    });
  });

  describe("logout", () => {
    it("clears both storages", async () => {
      await client.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });
      await client.logout();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(await client.getCurrentUser()).toBeNull();
    });
  });

  describe("getToken", () => {
    it("returns null (mock issues no token)", async () => {
      expect(await client.getToken()).toBeNull();
    });
  });
});

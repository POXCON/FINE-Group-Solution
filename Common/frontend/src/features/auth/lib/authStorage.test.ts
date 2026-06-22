import { describe, it, expect, beforeEach } from "vitest";
import {
  clearPreference,
  persistPreference,
  readPreference,
  resolveStorage,
  storageKindFor,
} from "./authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("storageKindFor", () => {
    it("maps rememberMe=true to local (persistent)", () => {
      expect(storageKindFor(true)).toBe("local");
    });

    it("maps rememberMe=false to session (cleared on close)", () => {
      expect(storageKindFor(false)).toBe("session");
    });
  });

  describe("resolveStorage", () => {
    it("returns localStorage for local", () => {
      expect(resolveStorage("local")).toBe(window.localStorage);
    });

    it("returns sessionStorage for session", () => {
      expect(resolveStorage("session")).toBe(window.sessionStorage);
    });
  });

  describe("persistPreference / readPreference", () => {
    it("persists and reads back 'local'", () => {
      persistPreference("local");
      expect(readPreference()).toBe("local");
    });

    it("persists and reads back 'session'", () => {
      persistPreference("session");
      expect(readPreference()).toBe("session");
    });

    it("defaults to 'session' when nothing stored", () => {
      expect(readPreference()).toBe("session");
    });

    it("defaults to 'session' for invalid stored values", () => {
      localStorage.setItem("fine-portal.remember", "garbage");
      expect(readPreference()).toBe("session");
    });

    it("preference is always kept in localStorage (not sessionStorage)", () => {
      persistPreference("local");
      expect(localStorage.getItem("fine-portal.remember")).toBe("local");
      expect(sessionStorage.getItem("fine-portal.remember")).toBeNull();
    });
  });

  describe("clearPreference", () => {
    it("removes the stored preference", () => {
      persistPreference("local");
      clearPreference();
      expect(readPreference()).toBe("session");
    });
  });

  describe("remember-toggle end-to-end selection", () => {
    it("ON stores data in localStorage", () => {
      const storage = resolveStorage(storageKindFor(true));
      storage.setItem("k", "v");
      expect(localStorage.getItem("k")).toBe("v");
      expect(sessionStorage.getItem("k")).toBeNull();
    });

    it("OFF stores data in sessionStorage", () => {
      const storage = resolveStorage(storageKindFor(false));
      storage.setItem("k", "v");
      expect(sessionStorage.getItem("k")).toBe("v");
      expect(localStorage.getItem("k")).toBeNull();
    });
  });
});

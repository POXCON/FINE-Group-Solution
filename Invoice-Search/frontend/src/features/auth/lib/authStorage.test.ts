import { describe, it, expect, beforeEach } from "vitest";
import { clearPreference, readPreference, resolveStorage } from "./authStorage";

describe("authStorage (SSO shared storage selection)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("resolveStorage", () => {
    it("returns localStorage for 'local'", () => {
      expect(resolveStorage("local")).toBe(window.localStorage);
    });

    it("returns sessionStorage for 'session'", () => {
      expect(resolveStorage("session")).toBe(window.sessionStorage);
    });
  });

  describe("readPreference", () => {
    it("reads 'local' written by the portal", () => {
      localStorage.setItem("fine-portal.remember", "local");
      expect(readPreference()).toBe("local");
    });

    it("reads 'session' written by the portal", () => {
      localStorage.setItem("fine-portal.remember", "session");
      expect(readPreference()).toBe("session");
    });

    it("defaults to 'session' when nothing stored", () => {
      expect(readPreference()).toBe("session");
    });

    it("defaults to 'session' for invalid stored values", () => {
      localStorage.setItem("fine-portal.remember", "garbage");
      expect(readPreference()).toBe("session");
    });

    it("reads the preference only from localStorage (not sessionStorage)", () => {
      sessionStorage.setItem("fine-portal.remember", "local");
      expect(readPreference()).toBe("session");
    });
  });

  describe("clearPreference", () => {
    it("removes the stored preference", () => {
      localStorage.setItem("fine-portal.remember", "local");
      clearPreference();
      expect(readPreference()).toBe("session");
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildMsalConfig,
  getApiScope,
  getLoginRequest,
  getTokenRequest,
  isMsalConfigured,
} from "./msalConfig";

const CLIENT_ID = "76537176-b582-4055-8b3e-cf89e84e1c08";
const AUTHORITY = "https://login.microsoftonline.com/tenant";
const API_SCOPE = "api://76537176-b582-4055-8b3e-cf89e84e1c08/access_as_user";

describe("msalConfig", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isMsalConfigured", () => {
    it("returns false when client id / authority are unset", () => {
      expect(isMsalConfigured()).toBe(false);
    });

    it("returns true when both client id and authority are present", () => {
      vi.stubEnv("VITE_AZURE_CLIENT_ID", CLIENT_ID);
      vi.stubEnv("VITE_AZURE_AUTHORITY", AUTHORITY);
      expect(isMsalConfigured()).toBe(true);
    });

    it("returns false when only the client id is present", () => {
      vi.stubEnv("VITE_AZURE_CLIENT_ID", CLIENT_ID);
      expect(isMsalConfigured()).toBe(false);
    });
  });

  describe("scopes", () => {
    it("getApiScope reads the configured API scope", () => {
      vi.stubEnv("VITE_AZURE_API_SCOPE", API_SCOPE);
      expect(getApiScope()).toBe(API_SCOPE);
    });

    it("getLoginRequest includes openid, profile and the API scope", () => {
      vi.stubEnv("VITE_AZURE_API_SCOPE", API_SCOPE);
      expect(getLoginRequest().scopes).toEqual(["openid", "profile", API_SCOPE]);
    });

    it("getLoginRequest omits the API scope when unset", () => {
      expect(getLoginRequest().scopes).toEqual(["openid", "profile"]);
    });

    it("getTokenRequest requests only the API scope", () => {
      vi.stubEnv("VITE_AZURE_API_SCOPE", API_SCOPE);
      expect(getTokenRequest().scopes).toEqual([API_SCOPE]);
    });
  });

  describe("buildMsalConfig", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_AZURE_CLIENT_ID", CLIENT_ID);
      vi.stubEnv("VITE_AZURE_AUTHORITY", AUTHORITY);
    });

    it("maps env values into the auth section", () => {
      const config = buildMsalConfig();
      expect(config.auth.clientId).toBe(CLIENT_ID);
      expect(config.auth.authority).toBe(AUTHORITY);
    });

    it("sets a redirect uri under the invoice-search subpath", () => {
      const config = buildMsalConfig();
      expect(config.auth.redirectUri).toContain("/invoice-search/");
    });

    it("uses sessionStorage cache when no preference is stored (default)", () => {
      const config = buildMsalConfig();
      expect(config.cache?.cacheLocation).toBe("sessionStorage");
    });

    it("uses localStorage cache when the portal remembers the login", () => {
      localStorage.setItem("fine-portal.remember", "local");
      const config = buildMsalConfig();
      expect(config.cache?.cacheLocation).toBe("localStorage");
    });
  });
});

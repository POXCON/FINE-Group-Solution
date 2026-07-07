import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMsalConfiguration,
  cacheLocationFor,
  loginRequestFor,
  readEntraEnv,
  type EntraEnv,
} from "./msalConfig";

const env: EntraEnv = {
  clientId: "client-123",
  authority: "https://login.microsoftonline.com/tenant-abc",
  apiScope: "api://client-123/access_as_user",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cacheLocationFor", () => {
  it("maps 'local' (remember ON) to localStorage", () => {
    expect(cacheLocationFor("local")).toBe("localStorage");
  });

  it("maps 'session' (remember OFF) to sessionStorage", () => {
    expect(cacheLocationFor("session")).toBe("sessionStorage");
  });
});

describe("buildMsalConfiguration", () => {
  it("uses the env clientId/authority and the selected cacheLocation", () => {
    const config = buildMsalConfiguration(env, "local");
    expect(config.auth.clientId).toBe(env.clientId);
    expect(config.auth.authority).toBe(env.authority);
    expect(config.cache?.cacheLocation).toBe("localStorage");
  });

  it("switches cacheLocation to sessionStorage when remember is OFF", () => {
    const config = buildMsalConfiguration(env, "session");
    expect(config.cache?.cacheLocation).toBe("sessionStorage");
  });

  it("sets redirect/post-logout URIs to the current origin", () => {
    const config = buildMsalConfiguration(env, "local");
    expect(config.auth.redirectUri).toBe(window.location.origin);
    expect(config.auth.postLogoutRedirectUri).toBe(window.location.origin);
  });
});

describe("loginRequestFor", () => {
  it("requests the configured API scope", () => {
    expect(loginRequestFor(env).scopes).toEqual([env.apiScope]);
  });
});

describe("readEntraEnv", () => {
  it("returns null when the required env vars are missing", () => {
    expect(readEntraEnv()).toBeNull();
  });

  it("returns the env when all required vars are present", () => {
    vi.stubEnv("VITE_AZURE_CLIENT_ID", env.clientId);
    vi.stubEnv("VITE_AZURE_AUTHORITY", env.authority);
    vi.stubEnv("VITE_AZURE_API_SCOPE", env.apiScope);
    expect(readEntraEnv()).toEqual(env);
  });

  it("returns null when only some vars are present", () => {
    vi.stubEnv("VITE_AZURE_CLIENT_ID", env.clientId);
    expect(readEntraEnv()).toBeNull();
  });
});

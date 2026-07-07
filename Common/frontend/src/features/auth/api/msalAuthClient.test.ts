import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountInfo, PublicClientApplication } from "@azure/msal-browser";
import { createMsalAuthClient } from "./msalAuthClient";
import type { EntraEnv } from "../lib/msalConfig";

const env: EntraEnv = {
  clientId: "client-123",
  authority: "https://login.microsoftonline.com/tenant-abc",
  apiScope: "api://client-123/access_as_user",
};

const PREFERENCE_KEY = "fine-portal.remember";

function makeAccount(overrides: Partial<AccountInfo> = {}): AccountInfo {
  return {
    homeAccountId: "hid",
    environment: "login.microsoftonline.com",
    tenantId: "tenant-abc",
    username: "user@example.com",
    localAccountId: "lid",
    name: "Account Name",
    idTokenClaims: { roles: ["admin", "store"], name: "Claim Name" },
    ...overrides,
  } as AccountInfo;
}

interface FakeInstance {
  initialize: ReturnType<typeof vi.fn>;
  handleRedirectPromise: ReturnType<typeof vi.fn>;
  setActiveAccount: ReturnType<typeof vi.fn>;
  getActiveAccount: ReturnType<typeof vi.fn>;
  getAllAccounts: ReturnType<typeof vi.fn>;
  loginRedirect: ReturnType<typeof vi.fn>;
  logoutRedirect: ReturnType<typeof vi.fn>;
  acquireTokenSilent: ReturnType<typeof vi.fn>;
}

function makeInstance(options: {
  accounts?: AccountInfo[];
  redirectResult?: { account: AccountInfo } | null;
} = {}): FakeInstance {
  let active: AccountInfo | null = null;
  const accounts = options.accounts ?? [];
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    handleRedirectPromise: vi
      .fn()
      .mockResolvedValue(options.redirectResult ?? null),
    setActiveAccount: vi.fn((account: AccountInfo | null) => {
      active = account;
    }),
    getActiveAccount: vi.fn(() => active),
    getAllAccounts: vi.fn(() => accounts),
    loginRedirect: vi.fn().mockResolvedValue(undefined),
    logoutRedirect: vi.fn().mockResolvedValue(undefined),
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: "token-abc" }),
  };
}

function asPca(instance: FakeInstance): PublicClientApplication {
  return instance as unknown as PublicClientApplication;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("createMsalAuthClient.getCurrentUser", () => {
  it("returns null when there are no accounts", async () => {
    const instance = makeInstance();
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    expect(await client.getCurrentUser()).toBeNull();
    expect(instance.initialize).toHaveBeenCalledOnce();
    expect(instance.handleRedirectPromise).toHaveBeenCalledOnce();
  });

  it("maps the roles claim into AuthUser.roles", async () => {
    const instance = makeInstance({ accounts: [makeAccount()] });
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    const user = await client.getCurrentUser();
    expect(user?.email).toBe("user@example.com");
    expect(user?.name).toBe("Claim Name");
    expect(user?.roles).toEqual(["admin", "store"]);
  });

  it("falls back to account.name when the name claim is absent", async () => {
    const account = makeAccount({ idTokenClaims: { roles: [] } });
    const instance = makeInstance({ accounts: [account] });
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    const user = await client.getCurrentUser();
    expect(user?.name).toBe("Account Name");
    expect(user?.roles).toEqual([]);
  });

  it("adopts the account returned by the redirect response as active", async () => {
    const account = makeAccount({ username: "redirect@example.com" });
    const instance = makeInstance({
      accounts: [account],
      redirectResult: { account },
    });
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    const user = await client.getCurrentUser();
    expect(instance.setActiveAccount).toHaveBeenCalledWith(account);
    expect(user?.email).toBe("redirect@example.com");
  });

  it("initializes only once across multiple calls", async () => {
    const instance = makeInstance({ accounts: [makeAccount()] });
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    await client.getCurrentUser();
    await client.getCurrentUser();
    expect(instance.initialize).toHaveBeenCalledOnce();
  });
});

describe("createMsalAuthClient.login (cacheLocation switch)", () => {
  it("persists 'session' and does not rebuild when remember stays OFF", async () => {
    const instance = makeInstance();
    const createInstance = vi.fn();
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
      createInstance,
    });
    void client.login({ rememberMe: false });
    await vi.waitFor(() => expect(instance.loginRedirect).toHaveBeenCalled());
    expect(localStorage.getItem(PREFERENCE_KEY)).toBe("session");
    expect(createInstance).not.toHaveBeenCalled();
    expect(instance.loginRedirect).toHaveBeenCalledWith({
      scopes: [env.apiScope],
    });
  });

  it("persists 'local' and rebuilds the PCA when remember turns ON", async () => {
    const original = makeInstance();
    const rebuilt = makeInstance();
    const createInstance = vi.fn(() => asPca(rebuilt));
    const client = createMsalAuthClient({
      instance: asPca(original),
      env,
      initialKind: "session",
      createInstance,
    });
    void client.login({ rememberMe: true });
    await vi.waitFor(() => expect(rebuilt.loginRedirect).toHaveBeenCalled());
    expect(localStorage.getItem(PREFERENCE_KEY)).toBe("local");
    expect(createInstance).toHaveBeenCalledWith(env, "local");
    expect(original.loginRedirect).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by loginRedirect", async () => {
    const instance = makeInstance();
    instance.loginRedirect.mockRejectedValue(new Error("redirect failed"));
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    await expect(client.login({ rememberMe: false })).rejects.toThrow(
      "redirect failed",
    );
  });
});

describe("createMsalAuthClient.logout", () => {
  it("calls logoutRedirect with the current account", async () => {
    const account = makeAccount();
    const instance = makeInstance({ accounts: [account] });
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    await client.logout();
    expect(instance.logoutRedirect).toHaveBeenCalledWith({ account });
  });
});

describe("createMsalAuthClient.getToken", () => {
  it("returns null when there is no account", async () => {
    const instance = makeInstance();
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    expect(await client.getToken()).toBeNull();
    expect(instance.acquireTokenSilent).not.toHaveBeenCalled();
  });

  it("returns the access token from acquireTokenSilent", async () => {
    const account = makeAccount();
    const instance = makeInstance({ accounts: [account] });
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    expect(await client.getToken()).toBe("token-abc");
    expect(instance.acquireTokenSilent).toHaveBeenCalledWith({
      scopes: [env.apiScope],
      account,
    });
  });

  it("returns null when silent token acquisition fails", async () => {
    const account = makeAccount();
    const instance = makeInstance({ accounts: [account] });
    instance.acquireTokenSilent.mockRejectedValue(new Error("interaction"));
    const client = createMsalAuthClient({
      instance: asPca(instance),
      env,
      initialKind: "session",
    });
    expect(await client.getToken()).toBeNull();
  });
});

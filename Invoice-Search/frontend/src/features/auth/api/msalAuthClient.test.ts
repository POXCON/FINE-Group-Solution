import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createMsalAuthClient } from "./msalAuthClient";

const API_SCOPE = "api://app-id/access_as_user";

function makeAccount(overrides: Partial<AccountInfo> = {}): AccountInfo {
  return {
    homeAccountId: "home-id",
    environment: "login.microsoftonline.com",
    tenantId: "tenant",
    username: "admin@example.com",
    localAccountId: "local-id",
    name: "管理 太郎",
    idTokenClaims: { roles: ["admin"], name: "管理 太郎" },
    ...overrides,
  } as AccountInfo;
}

interface FakeState {
  active: AccountInfo | null;
  accounts: AccountInfo[];
  ssoResult?: { account: AccountInfo };
  tokenResult?: { accessToken: string };
  tokenError?: Error;
}

function makeInstance(state: FakeState): {
  instance: IPublicClientApplication;
  setActiveAccount: ReturnType<typeof vi.fn>;
  acquireTokenSilent: ReturnType<typeof vi.fn>;
} {
  const setActiveAccount = vi.fn((account: AccountInfo | null) => {
    state.active = account;
  });
  const acquireTokenSilent = vi.fn(async () => {
    if (state.tokenError) {
      throw state.tokenError;
    }
    return state.tokenResult;
  });
  const instance = {
    getActiveAccount: () => state.active,
    getAllAccounts: () => state.accounts,
    setActiveAccount,
    ssoSilent: vi.fn(async () => state.ssoResult),
    acquireTokenSilent,
  } as unknown as IPublicClientApplication;

  return { instance, setActiveAccount, acquireTokenSilent };
}

describe("createMsalAuthClient", () => {
  let state: FakeState;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    state = { active: null, accounts: [] };
  });

  describe("getCurrentUser", () => {
    it("returns null when there is no account", async () => {
      const { instance } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      expect(await client.getCurrentUser()).toBeNull();
    });

    it("maps the active account roles into AuthUser", async () => {
      state.active = makeAccount();
      const { instance } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      const user = await client.getCurrentUser();
      expect(user).toEqual({ email: "admin@example.com", name: "管理 太郎", roles: ["admin"] });
    });

    it("falls back to the first account when no active account is set", async () => {
      state.accounts = [makeAccount({ username: "u@example.com" })];
      const { instance } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      const user = await client.getCurrentUser();
      expect(user?.email).toBe("u@example.com");
    });

    it("normalizes missing roles claim to an empty array", async () => {
      state.active = makeAccount({ idTokenClaims: { name: "No Roles" } });
      const { instance } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      const user = await client.getCurrentUser();
      expect(user?.roles).toEqual([]);
    });

    it("derives email from preferred_username when username is empty", async () => {
      state.active = makeAccount({
        username: "",
        idTokenClaims: { roles: ["admin"], preferred_username: "claim@example.com" },
      });
      const { instance } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      const user = await client.getCurrentUser();
      expect(user?.email).toBe("claim@example.com");
    });
  });

  describe("getToken", () => {
    it("returns null when there is no account", async () => {
      const { instance, acquireTokenSilent } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      expect(await client.getToken()).toBeNull();
      expect(acquireTokenSilent).not.toHaveBeenCalled();
    });

    it("returns the access token acquired silently for the API scope", async () => {
      state.active = makeAccount();
      state.tokenResult = { accessToken: "access-token-123" };
      const { instance, acquireTokenSilent } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      expect(await client.getToken()).toBe("access-token-123");
      expect(acquireTokenSilent).toHaveBeenCalledWith({
        scopes: [API_SCOPE],
        account: state.active,
      });
    });

    it("returns null when silent token acquisition fails", async () => {
      state.active = makeAccount();
      state.tokenError = new Error("interaction_required");
      const { instance } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      expect(await client.getToken()).toBeNull();
    });
  });

  describe("login", () => {
    it("sets the active account and returns the user via ssoSilent", async () => {
      const account = makeAccount();
      state.ssoResult = { account };
      const { instance, setActiveAccount } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      const user = await client.login({ email: "admin@example.com", password: "x" });
      expect(setActiveAccount).toHaveBeenCalledWith(account);
      expect(user.roles).toEqual(["admin"]);
    });
  });

  describe("logout", () => {
    it("clears the active account and portal preference without disturbing the cache", async () => {
      localStorage.setItem("fine-portal.remember", "local");
      state.active = makeAccount();
      const { instance, setActiveAccount } = makeInstance(state);
      const client = createMsalAuthClient(instance, API_SCOPE);
      await client.logout();
      expect(setActiveAccount).toHaveBeenCalledWith(null);
      expect(localStorage.getItem("fine-portal.remember")).toBeNull();
    });
  });
});

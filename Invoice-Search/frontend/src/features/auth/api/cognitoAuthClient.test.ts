import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * cognitoAuthClient が ID トークンの `cognito:groups` を読み取り、
 * AuthUser.groups に正規化して格納することを検証する。
 *
 * amazon-cognito-identity-js をモックし、任意の payload を返すセッションを注入する。
 */

interface MockPayload {
  email?: string;
  name?: string;
  "cognito:groups"?: unknown;
}

interface CognitoUserOptions {
  Username: string;
  Pool: unknown;
  Storage?: Storage;
}

let loginPayload: MockPayload = {};
let sessionPayload: MockPayload = {};
let hasCurrentUser = true;
let capturedUserStorage: Storage | undefined;

function makeSession(payload: MockPayload) {
  return {
    isValid: () => true,
    getIdToken: () => ({
      getJwtToken: () => "mock-jwt",
      decodePayload: () => payload,
    }),
  };
}

vi.mock("amazon-cognito-identity-js", () => {
  class AuthenticationDetails {
    constructor(_: unknown) {}
  }
  class CognitoUser {
    constructor(options?: CognitoUserOptions) {
      if (options) {
        capturedUserStorage = options.Storage;
      }
    }
    authenticateUser(_: unknown, callbacks: { onSuccess: (s: unknown) => void }): void {
      callbacks.onSuccess(makeSession(loginPayload));
    }
    getUsername(): string {
      return "fallback@example.com";
    }
    getSession(cb: (err: unknown, s: unknown) => void): void {
      cb(null, makeSession(sessionPayload));
    }
    signOut(): void {}
  }
  class CognitoUserPool {
    constructor(_: unknown) {}
    getCurrentUser(): CognitoUser | null {
      return hasCurrentUser ? new CognitoUser() : null;
    }
  }
  return { AuthenticationDetails, CognitoUser, CognitoUserPool };
});

import { createCognitoAuthClient } from "./cognitoAuthClient";

describe("createCognitoAuthClient groups handling", () => {
  beforeEach(() => {
    loginPayload = {};
    sessionPayload = {};
    hasCurrentUser = true;
    capturedUserStorage = undefined;
    localStorage.clear();
    sessionStorage.clear();
  });

  const client = createCognitoAuthClient({ userPoolId: "pool", clientId: "client" });

  it("login maps cognito:groups array into AuthUser.groups", async () => {
    loginPayload = {
      email: "admin@example.com",
      "cognito:groups": ["fine-admin", "other"],
    };
    const user = await client.login({ email: "admin@example.com", password: "password123" });
    expect(user.groups).toEqual(["fine-admin", "other"]);
  });

  it("login normalizes missing cognito:groups to an empty array", async () => {
    loginPayload = { email: "nogroups@example.com" };
    const user = await client.login({ email: "nogroups@example.com", password: "password123" });
    expect(user.groups).toEqual([]);
  });

  it("getCurrentUser maps cognito:groups into AuthUser.groups", async () => {
    sessionPayload = {
      email: "admin@example.com",
      "cognito:groups": ["fine-admin"],
    };
    const user = await client.getCurrentUser();
    expect(user?.groups).toEqual(["fine-admin"]);
  });

  it("getCurrentUser normalizes a single-string cognito:groups", async () => {
    sessionPayload = {
      email: "admin@example.com",
      "cognito:groups": "fine-admin",
    };
    const user = await client.getCurrentUser();
    expect(user?.groups).toEqual(["fine-admin"]);
  });

  it("login passes the session storage to CognitoUser when preference is unset (default)", async () => {
    loginPayload = { email: "user@example.com" };
    await client.login({ email: "user@example.com", password: "password123" });
    expect(capturedUserStorage).toBe(window.sessionStorage);
  });

  it("login passes the local storage to CognitoUser when preference is 'local'", async () => {
    window.localStorage.setItem("fine-portal.remember", "local");
    const localClient = createCognitoAuthClient({ userPoolId: "pool", clientId: "client" });
    loginPayload = { email: "user@example.com" };
    await localClient.login({ email: "user@example.com", password: "password123" });
    expect(capturedUserStorage).toBe(window.localStorage);
  });
});

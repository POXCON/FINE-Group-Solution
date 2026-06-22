import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * cognitoAuthClient の login が「ログイン情報を記憶する」トグルに応じて
 * CognitoUser へ正しい Storage を渡し、トークン保存先を統一することを検証する。
 *
 * amazon-cognito-identity-js をモックし、CognitoUser コンストラクタに渡された
 * Storage を捕捉して localStorage / sessionStorage いずれかを判定する。
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
    constructor(options: CognitoUserOptions) {
      capturedUserStorage = options.Storage;
    }
    authenticateUser(_: unknown, callbacks: { onSuccess: (s: unknown) => void }): void {
      callbacks.onSuccess(makeSession(loginPayload));
    }
    getUsername(): string {
      return "fallback@example.com";
    }
    getSession(cb: (err: unknown, s: unknown) => void): void {
      cb(null, makeSession(loginPayload));
    }
    signOut(): void {}
  }
  class CognitoUserPool {
    constructor(_: unknown) {}
    getCurrentUser(): CognitoUser | null {
      return null;
    }
  }
  return { AuthenticationDetails, CognitoUser, CognitoUserPool };
});

import { createCognitoAuthClient } from "./cognitoAuthClient";

describe("createCognitoAuthClient login storage selection", () => {
  beforeEach(() => {
    loginPayload = { email: "user@example.com" };
    capturedUserStorage = undefined;
    localStorage.clear();
    sessionStorage.clear();
  });

  const client = createCognitoAuthClient({ userPoolId: "pool", clientId: "client" });

  it("rememberMe=false stores tokens in sessionStorage", async () => {
    await client.login({
      email: "user@example.com",
      password: "password123",
      rememberMe: false,
    });
    expect(capturedUserStorage).toBe(window.sessionStorage);
    expect(capturedUserStorage).not.toBe(window.localStorage);
  });

  it("rememberMe=true stores tokens in localStorage", async () => {
    await client.login({
      email: "user@example.com",
      password: "password123",
      rememberMe: true,
    });
    expect(capturedUserStorage).toBe(window.localStorage);
    expect(capturedUserStorage).not.toBe(window.sessionStorage);
  });

  it("persists the remember preference for later getCurrentUser restoration", async () => {
    await client.login({
      email: "user@example.com",
      password: "password123",
      rememberMe: true,
    });
    expect(window.localStorage.getItem("fine-portal.remember")).toBe("local");
  });

  it("maps cognito:groups into AuthUser.groups on login", async () => {
    loginPayload = {
      email: "admin@example.com",
      "cognito:groups": ["fine-admin", "other"],
    };
    const user = await client.login({
      email: "admin@example.com",
      password: "password123",
      rememberMe: false,
    });
    expect(user.groups).toEqual(["fine-admin", "other"]);
  });
});

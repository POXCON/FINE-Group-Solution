import { describe, it, expect } from "vitest";
import {
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_STORE,
  isAdmin,
  normalizeRoles,
} from "./roles";
import type { AuthUser } from "../types";

function makeUser(roles: string[]): AuthUser {
  return { email: "user@example.com", roles };
}

describe("role constants", () => {
  it("use bare Entra values without the fine- prefix", () => {
    expect(ROLE_ADMIN).toBe("admin");
    expect(ROLE_STORE).toBe("store");
    expect(ROLE_MANAGER).toBe("manager");
  });
});

describe("normalizeRoles", () => {
  it("returns string array unchanged", () => {
    expect(normalizeRoles(["a", "b"])).toEqual(["a", "b"]);
  });

  it("filters out non-string values from arrays", () => {
    expect(normalizeRoles(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("wraps a single non-empty string into an array", () => {
    expect(normalizeRoles("admin")).toEqual(["admin"]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizeRoles(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(normalizeRoles("")).toEqual([]);
  });

  it("returns empty array for objects", () => {
    expect(normalizeRoles({ foo: "bar" })).toEqual([]);
  });
});

describe("isAdmin", () => {
  it("returns true when user has the admin role", () => {
    expect(isAdmin(makeUser([ROLE_ADMIN]))).toBe(true);
  });

  it("returns true when admin role is among others", () => {
    expect(isAdmin(makeUser([ROLE_STORE, ROLE_ADMIN]))).toBe(true);
  });

  it("returns false when user has no admin role", () => {
    expect(isAdmin(makeUser([ROLE_STORE]))).toBe(false);
  });

  it("returns false for empty roles", () => {
    expect(isAdmin(makeUser([]))).toBe(false);
  });

  it("returns false for null user", () => {
    expect(isAdmin(null)).toBe(false);
  });
});

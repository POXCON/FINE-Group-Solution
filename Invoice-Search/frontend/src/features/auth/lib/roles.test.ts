import { describe, it, expect } from "vitest";
import { ADMIN_ROLE, isAdmin, normalizeRoles } from "./roles";
import type { AuthUser } from "../types";

function makeUser(roles: readonly string[]): AuthUser {
  return { email: "user@example.com", roles };
}

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
    expect(isAdmin(makeUser([ADMIN_ROLE]))).toBe(true);
  });

  it("returns true when admin role is among others", () => {
    expect(isAdmin(makeUser(["store", ADMIN_ROLE]))).toBe(true);
  });

  it("returns false when user has no admin role", () => {
    expect(isAdmin(makeUser(["store"]))).toBe(false);
  });

  it("returns false for empty roles", () => {
    expect(isAdmin(makeUser([]))).toBe(false);
  });

  it("returns false for null user", () => {
    expect(isAdmin(null)).toBe(false);
  });
});

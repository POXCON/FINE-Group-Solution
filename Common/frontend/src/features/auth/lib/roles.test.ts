import { describe, it, expect } from "vitest";
import { ADMIN_GROUP, isAdmin, normalizeGroups } from "./roles";
import type { AuthUser } from "../types";

function makeUser(groups: string[]): AuthUser {
  return { email: "user@example.com", groups };
}

describe("normalizeGroups", () => {
  it("returns string array unchanged", () => {
    expect(normalizeGroups(["a", "b"])).toEqual(["a", "b"]);
  });

  it("filters out non-string values from arrays", () => {
    expect(normalizeGroups(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("wraps a single non-empty string into an array", () => {
    expect(normalizeGroups("fine-admin")).toEqual(["fine-admin"]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizeGroups(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(normalizeGroups("")).toEqual([]);
  });

  it("returns empty array for objects", () => {
    expect(normalizeGroups({ foo: "bar" })).toEqual([]);
  });
});

describe("isAdmin", () => {
  it("returns true when user is in the fine-admin group", () => {
    expect(isAdmin(makeUser([ADMIN_GROUP]))).toBe(true);
  });

  it("returns true when admin group is among others", () => {
    expect(isAdmin(makeUser(["staff", ADMIN_GROUP]))).toBe(true);
  });

  it("returns false when user has no admin group", () => {
    expect(isAdmin(makeUser(["staff"]))).toBe(false);
  });

  it("returns false for empty groups", () => {
    expect(isAdmin(makeUser([]))).toBe(false);
  });

  it("returns false for null user", () => {
    expect(isAdmin(null)).toBe(false);
  });
});

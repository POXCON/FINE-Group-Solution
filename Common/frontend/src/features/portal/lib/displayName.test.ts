import { describe, it, expect } from "vitest";
import { displayName } from "./displayName";

describe("displayName", () => {
  it("prefers the name when present", () => {
    expect(displayName({ email: "a@b.com", name: "Taro", roles: [] })).toBe("Taro");
  });

  it("falls back to the email local part when name is missing", () => {
    expect(displayName({ email: "taro@example.com", roles: [] })).toBe("taro");
  });

  it("falls back to the email local part when name is blank", () => {
    expect(displayName({ email: "hanako@example.com", name: "   ", roles: [] })).toBe(
      "hanako",
    );
  });

  it("returns the full email when there is no '@'", () => {
    expect(displayName({ email: "plainstring", roles: [] })).toBe("plainstring");
  });

  it("returns an empty string for a null user", () => {
    expect(displayName(null)).toBe("");
  });
});

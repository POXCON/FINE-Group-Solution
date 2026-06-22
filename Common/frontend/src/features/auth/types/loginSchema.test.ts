import { describe, it, expect } from "vitest";
import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
  const base = { email: "test@example.com", password: "password123", rememberMe: false };

  it("accepts valid credentials with rememberMe", () => {
    expect(loginSchema.safeParse({ ...base, rememberMe: true }).success).toBe(true);
  });

  it("accepts valid credentials without rememberMe", () => {
    expect(loginSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    expect(loginSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(loginSchema.safeParse({ ...base, email: "" }).success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(loginSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
  });

  it("accepts a password of exactly 8 characters", () => {
    expect(loginSchema.safeParse({ ...base, password: "12345678" }).success).toBe(true);
  });

  it("rejects a missing rememberMe field", () => {
    expect(
      loginSchema.safeParse({ email: "test@example.com", password: "password123" }).success,
    ).toBe(false);
  });

  it("infers correct values from parse", () => {
    const parsed = loginSchema.parse({ ...base, rememberMe: true });
    expect(parsed.email).toBe("test@example.com");
    expect(parsed.rememberMe).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { getErrorMessage, ApiError } from "./errors";

describe("getErrorMessage", () => {
  it("returns error.message for Error instances", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns string directly for string errors", () => {
    expect(getErrorMessage("string error")).toBe("string error");
  });

  it("returns fallback for unknown errors", () => {
    expect(getErrorMessage({ code: 42 })).toBe("Unexpected error");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null)).toBe("Unexpected error");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("Unexpected error");
  });

  it("returns fallback for numbers", () => {
    expect(getErrorMessage(404)).toBe("Unexpected error");
  });
});

describe("ApiError", () => {
  it("stores status code", () => {
    const error = new ApiError("Not found", 404);
    expect(error.status).toBe(404);
  });

  it("stores message", () => {
    const error = new ApiError("Not found", 404);
    expect(error.message).toBe("Not found");
  });

  it("has ApiError name", () => {
    const error = new ApiError("Server error", 500);
    expect(error.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const error = new ApiError("Bad request", 400);
    expect(error).toBeInstanceOf(Error);
  });
});

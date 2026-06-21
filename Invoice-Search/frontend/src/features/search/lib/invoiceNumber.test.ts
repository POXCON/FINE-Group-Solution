import { describe, it, expect } from "vitest";
import {
  normalizeInvoiceNumber,
  isValidInvoiceNumber,
  splitBulkInvoiceInput,
} from "./invoiceNumber";

describe("normalizeInvoiceNumber", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeInvoiceNumber("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeInvoiceNumber("   ")).toBe("");
  });

  it("prefixes T when not present on 13-digit number", () => {
    expect(normalizeInvoiceNumber("1234567890123")).toBe("T1234567890123");
  });

  it("does not double-prefix T", () => {
    expect(normalizeInvoiceNumber("T1234567890123")).toBe("T1234567890123");
  });

  it("trims surrounding whitespace before processing", () => {
    expect(normalizeInvoiceNumber("  T1234567890123  ")).toBe("T1234567890123");
  });

  it("trims whitespace and adds T prefix", () => {
    expect(normalizeInvoiceNumber("  1234567890123  ")).toBe("T1234567890123");
  });
});

describe("isValidInvoiceNumber", () => {
  it("returns true for 13-digit number with T prefix", () => {
    expect(isValidInvoiceNumber("T1234567890123")).toBe(true);
  });

  it("returns true for 13-digit number without T prefix", () => {
    expect(isValidInvoiceNumber("1234567890123")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isValidInvoiceNumber("")).toBe(false);
  });

  it("returns false for whitespace only", () => {
    expect(isValidInvoiceNumber("   ")).toBe(false);
  });

  it("returns false for 12-digit number", () => {
    expect(isValidInvoiceNumber("123456789012")).toBe(false);
  });

  it("returns false for 14-digit number", () => {
    expect(isValidInvoiceNumber("12345678901234")).toBe(false);
  });

  it("returns false for non-numeric characters", () => {
    expect(isValidInvoiceNumber("T12345678901AB")).toBe(false);
  });

  it("returns false for letters only", () => {
    expect(isValidInvoiceNumber("ABCDEFGHIJKLM")).toBe(false);
  });
});

describe("splitBulkInvoiceInput", () => {
  it("returns single value when no delimiter", () => {
    expect(splitBulkInvoiceInput("T1234567890123")).toEqual(["T1234567890123"]);
  });

  it("splits on newlines", () => {
    expect(splitBulkInvoiceInput("T1234567890123\nT9876543210987")).toEqual([
      "T1234567890123",
      "T9876543210987",
    ]);
  });

  it("splits on commas", () => {
    expect(splitBulkInvoiceInput("T1234567890123,T9876543210987")).toEqual([
      "T1234567890123",
      "T9876543210987",
    ]);
  });

  it("splits on mixed delimiters", () => {
    expect(splitBulkInvoiceInput("T1234567890123\nT9876543210987,T1111111111111")).toEqual([
      "T1234567890123",
      "T9876543210987",
      "T1111111111111",
    ]);
  });

  it("trims whitespace from each entry", () => {
    expect(splitBulkInvoiceInput("  T1234567890123  \n  T9876543210987  ")).toEqual([
      "T1234567890123",
      "T9876543210987",
    ]);
  });

  it("filters empty entries", () => {
    expect(splitBulkInvoiceInput("T1234567890123\n\nT9876543210987")).toEqual([
      "T1234567890123",
      "T9876543210987",
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(splitBulkInvoiceInput("")).toEqual([]);
  });
});

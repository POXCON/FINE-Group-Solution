import { describe, it, expect } from "vitest";
import { parseConsistencyCsv } from "./parseCsv";

describe("parseConsistencyCsv", () => {
  it("parses valid CSV with correct headers", async () => {
    const csv = "インボイス番号,会社名,住所\nT1234567890123,Test Co,Tokyo";
    const rows = await parseConsistencyCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      invoiceNumber: "T1234567890123",
      companyName: "Test Co",
      address: "Tokyo",
    });
  });

  it("parses multiple rows", async () => {
    const csv = [
      "インボイス番号,会社名,住所",
      "T1234567890123,Test Co,Tokyo",
      "T9876543210987,Other Co,Osaka",
    ].join("\n");
    const rows = await parseConsistencyCsv(csv);
    expect(rows).toHaveLength(2);
  });

  it("uses empty string for missing columns", async () => {
    const csv = "インボイス番号,会社名,住所\nT1234567890123,,";
    const rows = await parseConsistencyCsv(csv);
    expect(rows[0].companyName).toBe("");
    expect(rows[0].address).toBe("");
  });

  it("skips empty lines", async () => {
    const csv = "インボイス番号,会社名,住所\n\nT1234567890123,Test Co,Tokyo\n\n";
    const rows = await parseConsistencyCsv(csv);
    expect(rows).toHaveLength(1);
  });

  it("handles CSV with extra whitespace in values", async () => {
    const csv = "インボイス番号,会社名,住所\nT1234567890123,Test Co,Tokyo";
    const rows = await parseConsistencyCsv(csv);
    expect(rows[0].invoiceNumber).toBe("T1234567890123");
  });
});

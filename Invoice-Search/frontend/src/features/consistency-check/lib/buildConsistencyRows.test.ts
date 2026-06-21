import { describe, it, expect } from "vitest";
import { buildConsistencyRows, mergeConsistencyRow } from "./buildConsistencyRows";
import type { CsvRow } from "../types";
import type { InvoiceApiResult } from "@/features/search/types";

const makeId = (() => {
  let counter = 0;
  return () => `id-${++counter}`;
})();

describe("buildConsistencyRows", () => {
  const csvRows: CsvRow[] = [
    { invoiceNumber: "T1234567890123", companyName: "Test Co", address: "Tokyo" },
    { invoiceNumber: "T9876543210987", companyName: "Other Co", address: "Osaka" },
    { invoiceNumber: "INVALID", companyName: "Bad", address: "Kyoto" },
  ];

  const apiResults: InvoiceApiResult[] = [
    {
      invoiceNumber: "T1234567890123",
      invoiceName: "Test Co",
      invoiceAddress: "Tokyo",
    },
    {
      invoiceNumber: "T9876543210987",
      invoiceName: "Different Name",
      invoiceAddress: "Osaka",
    },
  ];

  it("marks consistent row as isConsistent true", () => {
    const rows = buildConsistencyRows(csvRows, apiResults, makeId);
    const consistent = rows.find((r) => r.invoiceNumber === "T1234567890123");
    expect(consistent?.isConsistent).toBe(true);
  });

  it("marks inconsistent row as isConsistent false when name differs", () => {
    const rows = buildConsistencyRows(csvRows, apiResults, makeId);
    const inconsistent = rows.find((r) => r.invoiceNumber === "T9876543210987");
    expect(inconsistent?.isConsistent).toBe(false);
  });

  it("marks invalid invoice number as isValidFormat false", () => {
    const rows = buildConsistencyRows(csvRows, apiResults, makeId);
    const invalid = rows.find((r) => r.invoiceNumber === "INVALID");
    expect(invalid?.isValidFormat).toBe(false);
  });

  it("marks valid invoice number as isValidFormat true", () => {
    const rows = buildConsistencyRows(csvRows, apiResults, makeId);
    const valid = rows.find((r) => r.invoiceNumber === "T1234567890123");
    expect(valid?.isValidFormat).toBe(true);
  });

  it("assigns api data to consistent row", () => {
    const rows = buildConsistencyRows(csvRows, apiResults, makeId);
    const consistent = rows.find((r) => r.invoiceNumber === "T1234567890123");
    expect(consistent?.apiCompanyName).toBe("Test Co");
    expect(consistent?.apiAddress).toBe("Tokyo");
  });

  it("sets apiCompanyName and apiAddress null for invalid row", () => {
    const rows = buildConsistencyRows(csvRows, apiResults, makeId);
    const invalid = rows.find((r) => r.invoiceNumber === "INVALID");
    expect(invalid?.apiCompanyName).toBeNull();
    expect(invalid?.apiAddress).toBeNull();
  });

  it("handles invoice number without T prefix in CSV", () => {
    const csvRowsWithoutT: CsvRow[] = [
      { invoiceNumber: "1234567890123", companyName: "Test Co", address: "Tokyo" },
    ];
    const rows = buildConsistencyRows(csvRowsWithoutT, apiResults, makeId);
    expect(rows[0].isConsistent).toBe(true);
  });

  it("assigns unique id to each row", () => {
    let idCounter = 0;
    const idGen = () => `generated-${++idCounter}`;
    const rows = buildConsistencyRows(csvRows, apiResults, idGen);
    const ids = rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("mergeConsistencyRow", () => {
  it("returns unchanged row when apiCompanyName is null", () => {
    const row = {
      id: "1",
      invoiceNumber: "T1234567890123",
      companyName: "Old",
      address: "Old Addr",
      isValidFormat: true,
      apiCompanyName: null,
      apiAddress: "New Addr",
      isConsistent: false,
    };
    expect(mergeConsistencyRow(row)).toEqual(row);
  });

  it("returns unchanged row when apiAddress is null", () => {
    const row = {
      id: "1",
      invoiceNumber: "T1234567890123",
      companyName: "Old",
      address: "Old Addr",
      isValidFormat: true,
      apiCompanyName: "New Name",
      apiAddress: null,
      isConsistent: false,
    };
    expect(mergeConsistencyRow(row)).toEqual(row);
  });

  it("merges api data and marks as consistent", () => {
    const row = {
      id: "1",
      invoiceNumber: "T1234567890123",
      companyName: "Old",
      address: "Old Addr",
      isValidFormat: true,
      apiCompanyName: "New Name",
      apiAddress: "New Addr",
      isConsistent: false,
    };
    const merged = mergeConsistencyRow(row);
    expect(merged.companyName).toBe("New Name");
    expect(merged.address).toBe("New Addr");
    expect(merged.isConsistent).toBe(true);
  });

  it("does not mutate original row", () => {
    const row = {
      id: "1",
      invoiceNumber: "T1234567890123",
      companyName: "Old",
      address: "Old Addr",
      isValidFormat: true,
      apiCompanyName: "New Name",
      apiAddress: "New Addr",
      isConsistent: false,
    };
    mergeConsistencyRow(row);
    expect(row.companyName).toBe("Old");
  });
});

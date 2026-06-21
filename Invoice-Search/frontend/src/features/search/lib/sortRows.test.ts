import { describe, it, expect } from "vitest";
import { sortRows } from "./sortRows";
import type { InvoiceSearchRow } from "../types";

const makeRow = (
  id: string,
  invoiceNumber: string,
  companyName: string,
  address: string,
): InvoiceSearchRow => ({
  id,
  invoiceNumber,
  companyName,
  address,
  tradeName: null,
  invoiceCheck: null,
});

describe("sortRows", () => {
  const rows: InvoiceSearchRow[] = [
    makeRow("1", "T3333333333333", "C Company", "Osaka"),
    makeRow("2", "T1111111111111", "A Company", "Tokyo"),
    makeRow("3", "T2222222222222", "B Company", "Kyoto"),
  ];

  it("sorts by invoiceNumber ascending", () => {
    const sorted = sortRows(rows, { field: "invoiceNumber", direction: "asc" });
    expect(sorted.map((r) => r.invoiceNumber)).toEqual([
      "T1111111111111",
      "T2222222222222",
      "T3333333333333",
    ]);
  });

  it("sorts by invoiceNumber descending", () => {
    const sorted = sortRows(rows, { field: "invoiceNumber", direction: "desc" });
    expect(sorted.map((r) => r.invoiceNumber)).toEqual([
      "T3333333333333",
      "T2222222222222",
      "T1111111111111",
    ]);
  });

  it("sorts by companyName ascending", () => {
    const sorted = sortRows(rows, { field: "companyName", direction: "asc" });
    expect(sorted.map((r) => r.companyName)).toEqual(["A Company", "B Company", "C Company"]);
  });

  it("sorts by companyName descending", () => {
    const sorted = sortRows(rows, { field: "companyName", direction: "desc" });
    expect(sorted.map((r) => r.companyName)).toEqual(["C Company", "B Company", "A Company"]);
  });

  it("sorts by address ascending", () => {
    const sorted = sortRows(rows, { field: "address", direction: "asc" });
    expect(sorted.map((r) => r.address)).toEqual(["Kyoto", "Osaka", "Tokyo"]);
  });

  it("sorts by address descending", () => {
    const sorted = sortRows(rows, { field: "address", direction: "desc" });
    expect(sorted.map((r) => r.address)).toEqual(["Tokyo", "Osaka", "Kyoto"]);
  });

  it("does not mutate the original array", () => {
    const original = [...rows];
    sortRows(rows, { field: "invoiceNumber", direction: "asc" });
    expect(rows).toEqual(original);
  });

  it("handles empty array", () => {
    expect(sortRows([], { field: "invoiceNumber", direction: "asc" })).toEqual([]);
  });
});

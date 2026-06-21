import { describe, it, expect } from "vitest";
import { mapApiResultToRow } from "./mapApiResultToRow";
import type { InvoiceApiResult } from "../types";

describe("mapApiResultToRow", () => {
  it("maps all fields correctly", () => {
    const result: InvoiceApiResult = {
      invoiceNumber: "T1234567890123",
      invoiceName: "Test Company",
      invoiceAddress: "Tokyo, Japan",
      invoiceTradeName: "Trade Name",
      invoiceCheck: true,
    };
    const row = mapApiResultToRow(result, "test-id");
    expect(row).toEqual({
      id: "test-id",
      invoiceNumber: "T1234567890123",
      companyName: "Test Company",
      address: "Tokyo, Japan",
      tradeName: "Trade Name",
      invoiceCheck: true,
    });
  });

  it("maps optional tradeName as null when undefined", () => {
    const result: InvoiceApiResult = {
      invoiceNumber: "T1234567890123",
      invoiceName: "Test Company",
      invoiceAddress: "Tokyo, Japan",
    };
    const row = mapApiResultToRow(result, "id-1");
    expect(row.tradeName).toBeNull();
  });

  it("maps optional invoiceCheck as null when undefined", () => {
    const result: InvoiceApiResult = {
      invoiceNumber: "T1234567890123",
      invoiceName: "Test Company",
      invoiceAddress: "Tokyo, Japan",
    };
    const row = mapApiResultToRow(result, "id-1");
    expect(row.invoiceCheck).toBeNull();
  });

  it("maps invoiceCheck false correctly", () => {
    const result: InvoiceApiResult = {
      invoiceNumber: "T1234567890123",
      invoiceName: "Test Company",
      invoiceAddress: "Tokyo, Japan",
      invoiceCheck: false,
    };
    const row = mapApiResultToRow(result, "id-2");
    expect(row.invoiceCheck).toBe(false);
  });

  it("uses the provided id", () => {
    const result: InvoiceApiResult = {
      invoiceNumber: "T1234567890123",
      invoiceName: "Test Company",
      invoiceAddress: "Tokyo, Japan",
    };
    expect(mapApiResultToRow(result, "custom-id").id).toBe("custom-id");
  });
});

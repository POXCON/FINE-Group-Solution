import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestInvoiceSearch } from "./requestInvoiceSearch";

const MOCK_BASE_URL = "http://api.example.com";

describe("requestInvoiceSearch", () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", MOCK_BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws when VITE_API_BASE_URL is not set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    await expect(
      requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] }),
    ).rejects.toThrow("VITE_API_BASE_URL is not configured.");
  });

  it("calls the correct endpoint with POST method", async () => {
    const mockResponse = [
      {
        invoiceNumber: "T1234567890123",
        invoiceName: "Test Co",
        invoiceAddress: "Tokyo",
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });

    expect(global.fetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/invoicesearch_webapi`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends invoice numbers in the request body", async () => {
    const mockResponse = [
      {
        invoiceNumber: "T1234567890123",
        invoiceName: "Test Co",
        invoiceAddress: "Tokyo",
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });

    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.invoiceNum).toEqual(["T1234567890123"]);
  });

  it("returns parsed results on success", async () => {
    const mockResponse = [
      {
        invoiceNumber: "T1234567890123",
        invoiceName: "Test Co",
        invoiceAddress: "Tokyo",
        invoiceTradeName: "Trade",
        invoiceCheck: true,
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const results = await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });
    expect(results).toHaveLength(1);
    expect(results[0].invoiceNumber).toBe("T1234567890123");
    expect(results[0].invoiceName).toBe("Test Co");
  });

  it("throws ApiError when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] }),
    ).rejects.toThrow("Invoice search request failed with status 500");
  });

  it("throws when response does not match expected schema", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ unexpectedField: "value" }]),
    });

    await expect(
      requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] }),
    ).rejects.toThrow("Invoice search response did not match the expected shape.");
  });

  it("includes userId in request body when provided", async () => {
    const mockResponse: never[] = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"], userId: "user@test.com" });

    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.userId).toBe("user@test.com");
  });

  void originalEnv;
});

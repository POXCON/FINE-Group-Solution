import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestInvoiceSearch } from "./requestInvoiceSearch";
import { authClient } from "@/features/auth/api/authClient";

const MOCK_BASE_URL = "http://api.example.com";

function okJson(body: unknown) {
  return { ok: true, json: () => Promise.resolve(body) };
}

function headersFromLastCall(): Record<string, string> {
  const callArgs = vi.mocked(global.fetch).mock.calls[0];
  return (callArgs[1]?.headers ?? {}) as Record<string, string>;
}

describe("requestInvoiceSearch", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", MOCK_BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("calls POST /api/invoice-search", async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ results: [] }));

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });

    expect(global.fetch).toHaveBeenCalledWith(
      `${MOCK_BASE_URL}/api/invoice-search`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("uses a same-origin relative path when VITE_API_BASE_URL is unset", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    global.fetch = vi.fn().mockResolvedValue(okJson({ results: [] }));

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/invoice-search",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends invoice numbers as { invoiceNum } and omits userId/isDebug", async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ results: [] }));

    await requestInvoiceSearch({
      invoiceNumbers: ["T1234567890123"],
      userId: "user@test.com",
    });

    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body).toEqual({ invoiceNum: ["T1234567890123"] });
    expect(body.userId).toBeUndefined();
    expect(body.isDebug).toBeUndefined();
  });

  it("returns the results array from the response envelope", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      okJson({
        results: [
          {
            invoiceNumber: "T1234567890123",
            name: "Test Co",
            address: "Tokyo",
            tradeName: "Trade",
            invoiceCheck: true,
          },
        ],
      }),
    );

    const results = await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });
    expect(results).toHaveLength(1);
    expect(results[0].invoiceNumber).toBe("T1234567890123");
    expect(results[0].name).toBe("Test Co");
    expect(results[0].invoiceCheck).toBe(true);
  });

  it("throws ApiError when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(
      requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] }),
    ).rejects.toThrow("Invoice search request failed with status 500");
  });

  it("attaches the access token as an Authorization: Bearer header", async () => {
    vi.spyOn(authClient, "getToken").mockResolvedValue("access-token-xyz");
    global.fetch = vi.fn().mockResolvedValue(okJson({ results: [] }));

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });

    expect(headersFromLastCall().Authorization).toBe("Bearer access-token-xyz");
  });

  it("omits the Authorization header when no token is available (mock mode)", async () => {
    vi.spyOn(authClient, "getToken").mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue(okJson({ results: [] }));

    await requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] });

    expect(headersFromLastCall().Authorization).toBeUndefined();
  });

  it("throws when the response is not the { results } envelope", async () => {
    // 旧契約（裸の配列）はもう受け付けない
    global.fetch = vi.fn().mockResolvedValue(
      okJson([{ invoiceNumber: "T1234567890123" }]),
    );

    await expect(
      requestInvoiceSearch({ invoiceNumbers: ["T1234567890123"] }),
    ).rejects.toThrow("Invoice search response did not match the expected shape.");
  });
});

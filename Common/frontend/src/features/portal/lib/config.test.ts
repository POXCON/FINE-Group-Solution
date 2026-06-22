import { describe, it, expect, afterEach, vi } from "vitest";
import { resolveInvoiceSearchUrl } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveInvoiceSearchUrl", () => {
  it("uses VITE_INVOICE_SEARCH_URL when set", () => {
    vi.stubEnv("VITE_INVOICE_SEARCH_URL", "https://custom.example.com");
    expect(resolveInvoiceSearchUrl()).toBe("https://custom.example.com");
  });

  it("falls back to the default CloudFront URL when unset", () => {
    vi.stubEnv("VITE_INVOICE_SEARCH_URL", "");
    expect(resolveInvoiceSearchUrl()).toBe("https://d2f2iacxluod2n.cloudfront.net");
  });
});

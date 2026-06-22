import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";
import { useInvoiceSearch } from "./useInvoiceSearch";

vi.mock("../api/requestInvoiceSearch");

const MOCK_BASE_URL = "http://api.test.com";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useInvoiceSearch", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", MOCK_BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns a mutation object", () => {
    const { result } = renderHook(() => useInvoiceSearch(), {
      wrapper: createWrapper(),
    });
    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it("calls requestInvoiceSearch when mutateAsync is called", async () => {
    const { requestInvoiceSearch } = await import("../api/requestInvoiceSearch");
    const mockResult = [
      {
        invoiceNumber: "T1234567890123",
        name: "Test Co",
        address: "Tokyo",
      },
    ];
    vi.mocked(requestInvoiceSearch).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useInvoiceSearch(), {
      wrapper: createWrapper(),
    });

    let returnValue;
    await act(async () => {
      returnValue = await result.current.mutateAsync(["T1234567890123"]);
    });

    expect(requestInvoiceSearch).toHaveBeenCalledWith({
      invoiceNumbers: ["T1234567890123"],
      userId: undefined,
    });
    expect(returnValue).toEqual(mockResult);
  });

  it("passes userId when provided", async () => {
    const { requestInvoiceSearch } = await import("../api/requestInvoiceSearch");
    vi.mocked(requestInvoiceSearch).mockResolvedValue([]);

    const { result } = renderHook(() => useInvoiceSearch({ userId: "user@test.com" }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(["T1234567890123"]);
    });

    expect(requestInvoiceSearch).toHaveBeenCalledWith({
      invoiceNumbers: ["T1234567890123"],
      userId: "user@test.com",
    });
  });

  it("sets isError when mutation fails", async () => {
    const { requestInvoiceSearch } = await import("../api/requestInvoiceSearch");
    vi.mocked(requestInvoiceSearch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInvoiceSearch(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(["T1234567890123"]);
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

import { ApiError } from "@/shared/lib/errors";
import { invoiceApiResponseSchema } from "../types";
import type { InvoiceApiResult } from "../types";

interface InvoiceSearchRequestOptions {
  invoiceNumbers: string[];
  userId?: string;
  signal?: AbortSignal;
}

/**
 * Calls the Invoice Search backend (FastAPI) to resolve invoice numbers
 * against the public registry. Validates the response shape with Zod so
 * unexpected payloads fail fast instead of crashing the UI.
 */
export async function requestInvoiceSearch({
  invoiceNumbers,
  userId,
  signal,
}: InvoiceSearchRequestOptions): Promise<InvoiceApiResult[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }

  const response = await fetch(`${baseUrl}/api/invoicesearch_webapi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: userId ?? null,
      invoiceNum: invoiceNumbers,
      isDebug: import.meta.env.MODE === "development",
    }),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(`Invoice search request failed with status ${response.status}`, response.status);
  }

  const data: unknown = await response.json();
  const parsed = invoiceApiResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invoice search response did not match the expected shape.");
  }

  return parsed.data;
}

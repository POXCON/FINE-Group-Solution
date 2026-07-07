import { ApiError } from "@/shared/lib/errors";
import { authClient } from "@/features/auth/api/authClient";
import { invoiceApiResponseSchema } from "../types";
import type { InvoiceApiResult } from "../types";

interface InvoiceSearchRequestOptions {
  invoiceNumbers: string[];
  /** 互換のため受け取るが本文には含めない（ユーザーは JWT からサーバ側で解決）。 */
  userId?: string;
  signal?: AbortSignal;
}

/**
 * Calls the Invoice Search backend (FastAPI `POST /api/invoice-search`) to
 * resolve invoice numbers against the public registry. The Entra ID access
 * token (scope `access_as_user`, when authenticated) is attached as a Bearer
 * token; in mock-auth mode no token is sent and the backend runs with
 * AUTH_DISABLED. The response shape is validated with Zod so unexpected
 * payloads fail fast.
 */
export async function requestInvoiceSearch({
  invoiceNumbers,
  signal,
}: InvoiceSearchRequestOptions): Promise<InvoiceApiResult[]> {
  // 未設定なら同一オリジン相対パス（Static Web Apps 経由で Azure Container Apps(API) へ）。
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await authClient.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/invoice-search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ invoiceNum: invoiceNumbers }),
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

  return parsed.data.results;
}

import { z } from "zod";

export const INVOICE_NUMBER_PATTERN = /^T?\d{13}$/;

// バックエンド POST /api/invoice-search のレスポンス契約に準拠。
// 会社名/住所は公表APIに無い場合があり null 許容。
// invoiceCheck: true=登録済み / false=失効・取消 / null=不明。
export const invoiceApiResultSchema = z.object({
  invoiceNumber: z.string(),
  name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  tradeName: z.string().nullable().optional(),
  invoiceCheck: z.boolean().nullable().optional(),
});

export const invoiceApiResponseSchema = z.object({
  results: z.array(invoiceApiResultSchema),
});

export type InvoiceApiResult = z.infer<typeof invoiceApiResultSchema>;

export interface InvoiceSearchRow {
  id: string;
  invoiceNumber: string;
  companyName: string;
  address: string;
  tradeName: string | null;
  invoiceCheck: boolean | null;
}

export type SortField = "invoiceNumber" | "companyName" | "address";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

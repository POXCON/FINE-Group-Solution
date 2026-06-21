import { z } from "zod";

export const INVOICE_NUMBER_PATTERN = /^T?\d{13}$/;

export const invoiceApiResultSchema = z.object({
  invoiceNumber: z.string(),
  invoiceName: z.string(),
  invoiceAddress: z.string(),
  invoiceTradeName: z.string().optional(),
  invoiceCheck: z.boolean().optional(),
});

export const invoiceApiResponseSchema = z.array(invoiceApiResultSchema);

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

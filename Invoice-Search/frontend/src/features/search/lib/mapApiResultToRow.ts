import type { InvoiceApiResult, InvoiceSearchRow } from "../types";

export function mapApiResultToRow(result: InvoiceApiResult, id: string): InvoiceSearchRow {
  return {
    id,
    invoiceNumber: result.invoiceNumber,
    companyName: result.name ?? "",
    address: result.address ?? "",
    tradeName: result.tradeName ?? null,
    invoiceCheck: result.invoiceCheck ?? null,
  };
}

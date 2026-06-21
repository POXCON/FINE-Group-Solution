import type { InvoiceApiResult, InvoiceSearchRow } from "../types";

export function mapApiResultToRow(result: InvoiceApiResult, id: string): InvoiceSearchRow {
  return {
    id,
    invoiceNumber: result.invoiceNumber,
    companyName: result.invoiceName,
    address: result.invoiceAddress,
    tradeName: result.invoiceTradeName ?? null,
    invoiceCheck: result.invoiceCheck ?? null,
  };
}

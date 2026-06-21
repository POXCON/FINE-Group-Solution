import { isValidInvoiceNumber } from "@/features/search/lib/invoiceNumber";
import type { InvoiceApiResult } from "@/features/search/types";
import type { ConsistencyRow, CsvRow } from "../types";

function findApiResult(
  csvRow: CsvRow,
  apiResults: InvoiceApiResult[],
): InvoiceApiResult | undefined {
  const normalized = csvRow.invoiceNumber.startsWith("T")
    ? csvRow.invoiceNumber
    : `T${csvRow.invoiceNumber}`;
  return apiResults.find((result) => result.invoiceNumber === normalized);
}

export function buildConsistencyRows(
  csvRows: CsvRow[],
  apiResults: InvoiceApiResult[],
  idGenerator: () => string,
): ConsistencyRow[] {
  return csvRows.map((csvRow) => {
    const isValidFormat = isValidInvoiceNumber(csvRow.invoiceNumber);
    const apiResult = isValidFormat ? findApiResult(csvRow, apiResults) : undefined;
    const apiCompanyName = apiResult?.invoiceName ?? null;
    const apiAddress = apiResult?.invoiceAddress ?? null;
    const isConsistent =
      apiCompanyName !== null &&
      apiAddress !== null &&
      apiCompanyName === csvRow.companyName &&
      apiAddress === csvRow.address;

    return {
      ...csvRow,
      id: idGenerator(),
      isValidFormat,
      apiCompanyName,
      apiAddress,
      isConsistent,
    };
  });
}

export function mergeConsistencyRow(row: ConsistencyRow): ConsistencyRow {
  if (row.apiCompanyName === null || row.apiAddress === null) {
    return row;
  }
  return {
    ...row,
    companyName: row.apiCompanyName,
    address: row.apiAddress,
    isConsistent: true,
  };
}

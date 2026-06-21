import { INVOICE_NUMBER_PATTERN } from "../types";

/**
 * Normalizes a raw invoice number input by trimming whitespace and
 * prefixing a leading "T" when absent, per the 13-digit registry format.
 */
export function normalizeInvoiceNumber(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "";
  }
  return trimmed.startsWith("T") ? trimmed : `T${trimmed}`;
}

export function isValidInvoiceNumber(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return false;
  }
  return INVOICE_NUMBER_PATTERN.test(trimmed);
}

/**
 * Splits bulk-pasted text into individual invoice number candidates using
 * newlines and commas as delimiters, discarding empty entries.
 */
export function splitBulkInvoiceInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

import Papa from "papaparse";
import { RAW_CSV_COLUMNS } from "../types";
import type { CsvRow } from "../types";

type RawCsvRecord = Record<string, string>;

/**
 * Parses CSV text in the legacy "インボイス番号/会社名/住所" header
 * format into normalized rows. Rejects malformed CSV via a rejected
 * promise so callers can surface a user-facing error.
 */
export function parseConsistencyCsv(content: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRecord>(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        const rows = results.data.map((record) => ({
          invoiceNumber: record[RAW_CSV_COLUMNS.invoiceNumber] ?? "",
          companyName: record[RAW_CSV_COLUMNS.companyName] ?? "",
          address: record[RAW_CSV_COLUMNS.address] ?? "",
        }));
        resolve(rows);
      },
      error: (error: Error) => reject(error),
    });
  });
}

import { useMutation } from "@tanstack/react-query";
import { requestInvoiceSearch } from "@/features/search/api/requestInvoiceSearch";
import { normalizeInvoiceNumber } from "@/features/search/lib/invoiceNumber";
import { chunkArray } from "../lib/chunk";
import { buildConsistencyRows } from "../lib/buildConsistencyRows";
import type { CsvRow } from "../types";

const BATCH_SIZE = 10;

interface UseConsistencyCheckOptions {
  userId?: string;
}

async function searchValidRows(validRows: CsvRow[], userId?: string) {
  const invoiceNumbers = validRows.map((row) => normalizeInvoiceNumber(row.invoiceNumber));
  const batches = chunkArray(invoiceNumbers, BATCH_SIZE);
  const batchResults = await Promise.all(
    batches.map((batch) => requestInvoiceSearch({ invoiceNumbers: batch, userId })),
  );
  return batchResults.flat();
}

export function useConsistencyCheck({ userId }: UseConsistencyCheckOptions = {}) {
  return useMutation({
    mutationFn: async (csvRows: CsvRow[]) => {
      const validRows = csvRows.filter((row) =>
        /^T?\d{13}$/.test(row.invoiceNumber.trim()),
      );
      const apiResults = await searchValidRows(validRows, userId);
      return buildConsistencyRows(csvRows, apiResults, () => crypto.randomUUID());
    },
  });
}

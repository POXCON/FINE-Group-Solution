import { useMutation } from "@tanstack/react-query";
import { requestInvoiceSearch } from "../api/requestInvoiceSearch";
import type { InvoiceApiResult } from "../types";

interface UseInvoiceSearchOptions {
  userId?: string;
}

export function useInvoiceSearch({ userId }: UseInvoiceSearchOptions = {}) {
  return useMutation<InvoiceApiResult[], Error, string[]>({
    mutationFn: (invoiceNumbers: string[]) =>
      requestInvoiceSearch({ invoiceNumbers, userId }),
  });
}

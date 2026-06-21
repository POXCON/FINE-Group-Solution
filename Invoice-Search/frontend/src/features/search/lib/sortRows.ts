import type { InvoiceSearchRow, SortState } from "../types";

export function sortRows(rows: InvoiceSearchRow[], sort: SortState): InvoiceSearchRow[] {
  const sorted = [...rows].sort((a, b) => {
    const aValue = a[sort.field];
    const bValue = b[sort.field];
    return aValue.localeCompare(bValue);
  });
  return sort.direction === "asc" ? sorted : sorted.reverse();
}

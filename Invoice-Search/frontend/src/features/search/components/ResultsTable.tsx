import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortRows } from "../lib/sortRows";
import type { InvoiceSearchRow, SortField, SortState } from "../types";

interface ResultsTableProps {
  rows: InvoiceSearchRow[];
  onDeleteRow: (id: string) => void;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sort: SortState;
  onSort: (field: SortField) => void;
}

function SortableHeader({ field, label, sort, onSort }: SortableHeaderProps): React.JSX.Element {
  const isActive = sort.field === field;
  const indicator = isActive ? (sort.direction === "asc" ? "▲" : "▼") : "";
  return (
    <th>
      <button
        type="button"
        className="flex items-center gap-1 font-bold"
        onClick={() => onSort(field)}
      >
        {label} <span aria-hidden="true">{indicator}</span>
      </button>
    </th>
  );
}

export function ResultsTable({ rows, onDeleteRow }: ResultsTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const [sort, setSort] = useState<SortState>({ field: "invoiceNumber", direction: "asc" });

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  const handleSort = (field: SortField): void => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" },
    );
  };

  if (rows.length === 0) {
    return (
      <div className="alert" role="status">
        <span>{t("search.emptyState")}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <SortableHeader
              field="invoiceNumber"
              label={t("search.column.invoiceNumber")}
              sort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              field="companyName"
              label={t("search.column.companyName")}
              sort={sort}
              onSort={handleSort}
            />
            <SortableHeader
              field="address"
              label={t("search.column.address")}
              sort={sort}
              onSort={handleSort}
            />
            <th>{t("search.column.tradeName")}</th>
            <th>{t("search.column.invoiceCheck")}</th>
            <th>{t("search.column.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.id}>
              <td>{row.invoiceNumber}</td>
              <td>{row.companyName}</td>
              <td>{row.address}</td>
              <td>{row.tradeName ?? "-"}</td>
              <td>
                {row.invoiceCheck === null ? (
                  "-"
                ) : (
                  <span
                    className={`badge ${row.invoiceCheck ? "badge-success" : "badge-error"}`}
                  >
                    {row.invoiceCheck ? t("search.registered") : t("search.notRegistered")}
                  </span>
                )}
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => onDeleteRow(row.id)}
                  aria-label={`${t("common.delete")} ${row.invoiceNumber}`}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

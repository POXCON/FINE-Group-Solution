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
    <th className="bg-base-200/70">
      <button
        type="button"
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
          isActive ? "text-primary" : "text-base-content/60"
        }`}
        onClick={() => onSort(field)}
      >
        {label}
        <span aria-hidden="true" className="text-[0.6rem]">
          {indicator}
        </span>
      </button>
    </th>
  );
}

function StatusBadge({
  invoiceCheck,
  registeredLabel,
  notRegisteredLabel,
}: {
  invoiceCheck: boolean | null;
  registeredLabel: string;
  notRegisteredLabel: string;
}): React.JSX.Element {
  if (invoiceCheck === null) {
    return <span className="text-base-content/40">-</span>;
  }
  // E2E は .badge-success / .badge-error を参照するためクラス名は維持する
  return (
    <span
      className={`badge badge-sm gap-1.5 font-medium ${
        invoiceCheck ? "badge-success" : "badge-error"
      } badge-outline`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          invoiceCheck ? "bg-success" : "bg-error"
        }`}
      />
      {invoiceCheck ? registeredLabel : notRegisteredLabel}
    </span>
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
      <div className="rounded-box border border-base-300 bg-base-100 shadow-card">
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          role="status"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 text-base-content/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
              />
            </svg>
          </div>
          <p className="max-w-xs text-sm text-base-content/60">
            {t("search.emptyState")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-base-content">
          {t("search.resultsTitle")}
        </h2>
        <span className="badge badge-ghost badge-sm tabular">
          {t("search.resultCount", { count: rows.length })}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
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
              <th className="bg-base-200/70 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                {t("search.column.tradeName")}
              </th>
              <th className="bg-base-200/70 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                {t("search.column.invoiceCheck")}
              </th>
              <th className="bg-base-200/70 text-right text-xs font-semibold uppercase tracking-wide text-base-content/60">
                {t("search.column.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="hover">
                <td className="tabular font-medium">{row.invoiceNumber}</td>
                <td>{row.companyName}</td>
                <td className="text-base-content/80">{row.address}</td>
                <td className="text-base-content/80">{row.tradeName ?? "-"}</td>
                <td>
                  <StatusBadge
                    invoiceCheck={row.invoiceCheck}
                    registeredLabel={t("search.registered")}
                    notRegisteredLabel={t("search.notRegistered")}
                  />
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-base-content/50 hover:text-error"
                    onClick={() => onDeleteRow(row.id)}
                    aria-label={`${t("common.delete")} ${row.invoiceNumber}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { InvoiceInputForm } from "./InvoiceInputForm";
import { ResultsTable } from "./ResultsTable";
import { useInvoiceSearch } from "../hooks/useInvoiceSearch";
import { isValidInvoiceNumber, normalizeInvoiceNumber } from "../lib/invoiceNumber";
import { mapApiResultToRow } from "../lib/mapApiResultToRow";
import { buildCsv, downloadCsv } from "@/shared/lib/csv";
import { useAuth } from "@/features/auth/hooks/useAuthContext";
import type { InvoiceSearchRow } from "../types";

const CSV_HEADERS = ["インボイス番号", "会社名", "住所"];
const CSV_FILE_NAME = "invoiceData.csv";

export function SearchPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [inputValues, setInputValues] = useState<string[]>([""]);
  const [rows, setRows] = useState<InvoiceSearchRow[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const searchMutation = useInvoiceSearch({ userId: user?.email });

  const handleSearch = async (): Promise<void> => {
    setValidationError(null);
    const validValues = inputValues.filter((value) => value.trim() !== "");

    if (validValues.length === 0) {
      setValidationError(t("search.noValidInput"));
      return;
    }

    const hasInvalidFormat = validValues.some((value) => !isValidInvoiceNumber(value));
    if (hasInvalidFormat) {
      setValidationError(t("search.invalidFormat"));
      return;
    }

    const normalized = validValues.map(normalizeInvoiceNumber);
    const results = await searchMutation.mutateAsync(normalized);
    const newRows = results.map((result) => mapApiResultToRow(result, crypto.randomUUID()));
    setRows((previous) => [...previous, ...newRows]);
    setInputValues([""]);
  };

  const handleReset = (): void => {
    setInputValues([""]);
    setRows([]);
    setValidationError(null);
  };

  const handleDeleteRow = (id: string): void => {
    setRows((previous) => previous.filter((row) => row.id !== id));
  };

  const handleDownload = (): void => {
    if (rows.length === 0) {
      setValidationError(t("search.noDataToDownload"));
      return;
    }
    const csv = buildCsv(
      CSV_HEADERS,
      rows.map((row) => [row.invoiceNumber, row.companyName, row.address]),
    );
    downloadCsv(csv, CSV_FILE_NAME);
  };

  return (
    <div className="flex flex-col gap-5">
      <InvoiceInputForm
        values={inputValues}
        onChange={setInputValues}
        disabled={searchMutation.isPending}
      />

      {(validationError || searchMutation.isError) && (
        <div role="alert" className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <span>{validationError ?? t("search.searchError")}</span>
        </div>
      )}

      {/* アクションバー */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleReset}
          disabled={searchMutation.isPending}
        >
          {t("common.reset")}
        </button>
        <button
          type="button"
          className="btn btn-outline gap-2"
          onClick={handleDownload}
          disabled={searchMutation.isPending}
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
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {t("common.download")}
        </button>
        <button
          type="button"
          className="btn btn-primary gap-2"
          onClick={handleSearch}
          disabled={searchMutation.isPending}
        >
          {searchMutation.isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
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
                d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
              />
            </svg>
          )}
          {searchMutation.isPending ? t("common.loading") : t("common.search")}
        </button>
      </div>

      <ResultsTable rows={rows} onDeleteRow={handleDeleteRow} />
    </div>
  );
}

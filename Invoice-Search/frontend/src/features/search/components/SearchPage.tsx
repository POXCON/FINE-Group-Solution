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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <InvoiceInputForm
        values={inputValues}
        onChange={setInputValues}
        disabled={searchMutation.isPending}
      />

      {(validationError || searchMutation.isError) && (
        <div role="alert" className="alert alert-error">
          <span>{validationError ?? t("search.searchError")}</span>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={searchMutation.isPending}
        >
          {searchMutation.isPending ? t("common.loading") : t("common.search")}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleReset}
          disabled={searchMutation.isPending}
        >
          {t("common.reset")}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownload}
          disabled={searchMutation.isPending}
        >
          {t("common.download")}
        </button>
      </div>

      <ResultsTable rows={rows} onDeleteRow={handleDeleteRow} />
    </div>
  );
}

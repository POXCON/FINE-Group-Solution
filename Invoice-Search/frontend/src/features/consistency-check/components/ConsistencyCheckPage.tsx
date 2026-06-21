import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuthContext";
import { parseConsistencyCsv } from "../lib/parseCsv";
import { useConsistencyCheck } from "../hooks/useConsistencyCheck";
import { mergeConsistencyRow } from "../lib/buildConsistencyRows";
import { getErrorMessage } from "@/shared/lib/errors";
import type { ConsistencyRow } from "../types";

export function ConsistencyCheckPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<ConsistencyRow[]>([]);
  const checkMutation = useConsistencyCheck({ userId: user?.email });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileError(null);
  };

  const handleCheck = async (): Promise<void> => {
    if (!selectedFile) {
      setFileError(t("consistencyCheck.fileNotSelected"));
      return;
    }
    setFileError(null);
    try {
      const text = await selectedFile.text();
      const csvRows = await parseConsistencyCsv(text);
      const result = await checkMutation.mutateAsync(csvRows);
      setRows(result);
    } catch (error: unknown) {
      setFileError(getErrorMessage(error));
    }
  };

  const handleMerge = (id: string): void => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? mergeConsistencyRow(row) : row)),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* アップロードカード */}
      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-card md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-base-content">
            {t("consistencyCheck.uploadCardTitle")}
          </h2>
          <p className="mt-1 text-sm text-base-content/60">
            {t("consistencyCheck.uploadHint")}
          </p>
        </div>

        <div
          className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-box border-2 border-dashed border-base-300 bg-base-200/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-100 text-base-content/40 shadow-sm transition-colors group-hover:text-primary">
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p className="text-sm text-base-content/60">
            {t("consistencyCheck.uploadHint")}
          </p>
          {selectedFile && (
            <p className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-sm font-medium text-base-content">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("consistencyCheck.selectedFile")} {selectedFile.name}
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {fileError && (
          <div role="alert" className="alert alert-error mt-4">
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
            <span>{fileError}</span>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn btn-primary gap-2"
            onClick={() => {
              void handleCheck();
            }}
            disabled={checkMutation.isPending}
          >
            {checkMutation.isPending ? (
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}
            {checkMutation.isPending ? t("common.loading") : t("consistencyCheck.check")}
          </button>
        </div>
      </section>

      {rows.length === 0 && !checkMutation.isPending && (
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="max-w-xs text-sm text-base-content/60">
              {t("consistencyCheck.emptyState")}
            </p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
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
                  <th className="bg-base-200/70 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                    {t("consistencyCheck.title")}
                  </th>
                  <th className="bg-base-200/70 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                    {t("search.column.invoiceNumber")}
                  </th>
                  <th className="bg-base-200/70 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                    {t("search.column.companyName")}
                  </th>
                  <th className="bg-base-200/70 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                    {t("search.column.address")}
                  </th>
                  <th className="bg-base-200/70 text-right text-xs font-semibold uppercase tracking-wide text-base-content/60" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover">
                    <td>
                      <span
                        className={`badge badge-sm gap-1.5 font-medium badge-outline ${
                          row.isConsistent ? "badge-success" : "badge-error"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${
                            row.isConsistent ? "bg-success" : "bg-error"
                          }`}
                        />
                        {row.isConsistent ? t("consistencyCheck.consistent") : "NG"}
                      </span>
                    </td>
                    <td className="tabular font-medium">{row.invoiceNumber}</td>
                    <td className={row.isConsistent ? "" : "text-error"}>
                      {row.companyName}
                    </td>
                    <td
                      className={row.isConsistent ? "text-base-content/80" : "text-error"}
                    >
                      {row.address}
                    </td>
                    <td className="text-right">
                      {!row.isConsistent && row.apiCompanyName && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-primary gap-1"
                          onClick={() => handleMerge(row.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                            />
                          </svg>
                          {t("consistencyCheck.merge")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

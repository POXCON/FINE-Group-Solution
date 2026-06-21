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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t("consistencyCheck.title")}</h1>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div
            className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            role="button"
            tabIndex={0}
          >
            <p className="text-base-content/60">{t("consistencyCheck.uploadHint")}</p>
            {selectedFile && (
              <p className="mt-2 font-medium">
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
            <div role="alert" className="alert alert-error">
              <span>{fileError}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary self-start"
            onClick={() => { void handleCheck(); }}
            disabled={checkMutation.isPending}
          >
            {checkMutation.isPending ? t("common.loading") : t("consistencyCheck.check")}
          </button>
        </div>
      </div>

      {rows.length === 0 && !checkMutation.isPending && (
        <div className="alert" role="status">
          <span>{t("consistencyCheck.emptyState")}</span>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t("consistencyCheck.title")}</th>
                <th>{t("search.column.invoiceNumber")}</th>
                <th>{t("search.column.companyName")}</th>
                <th>{t("search.column.address")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.isConsistent ? "" : "text-error"}>
                  <td>
                    <span className={`badge ${row.isConsistent ? "badge-success" : "badge-error"}`}>
                      {row.isConsistent ? t("consistencyCheck.consistent") : "NG"}
                    </span>
                  </td>
                  <td>{row.invoiceNumber}</td>
                  <td>{row.companyName}</td>
                  <td>{row.address}</td>
                  <td>
                    {!row.isConsistent && row.apiCompanyName && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleMerge(row.id)}
                      >
                        {t("consistencyCheck.merge")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

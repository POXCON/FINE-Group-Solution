import { useTranslation } from "react-i18next";
import type { ClipboardEvent } from "react";
import { isValidInvoiceNumber, splitBulkInvoiceInput } from "../lib/invoiceNumber";

interface InvoiceInputFormProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled: boolean;
}

function isRowInvalid(value: string): boolean {
  return value.trim() !== "" && !isValidInvoiceNumber(value);
}

export function InvoiceInputForm({
  values,
  onChange,
  disabled,
}: InvoiceInputFormProps): React.JSX.Element {
  const { t } = useTranslation();

  const updateRow = (index: number, value: string): void => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const addRow = (): void => {
    onChange([...values, ""]);
  };

  const removeRow = (index: number): void => {
    const next = values.filter((_, rowIndex) => rowIndex !== index);
    onChange(next.length > 0 ? next : [""]);
  };

  const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>): void => {
    const pasted = event.clipboardData.getData("text");
    const entries = splitBulkInvoiceInput(pasted);
    if (entries.length <= 1) {
      return;
    }
    event.preventDefault();
    const next = [...values];
    next.splice(index, 1, ...entries);
    onChange(next);
  };

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-card md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-base-content">{t("search.title")}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t("search.pasteHint")}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {values.map((value, index) => {
          const invalid = isRowInvalid(value);
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.6}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3.75h6m-9 5.25V6a2.25 2.25 0 0 1 2.25-2.25h9A2.25 2.25 0 0 1 19.5 6v12l-3-1.5-3 1.5-3-1.5-3 1.5Z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  className={`input input-bordered tabular w-full pl-9 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    invalid ? "input-error" : ""
                  }`}
                  placeholder={t("search.placeholder")}
                  value={value}
                  disabled={disabled}
                  onChange={(event) => updateRow(index, event.target.value)}
                  onPaste={handlePaste(index)}
                  aria-invalid={invalid}
                  aria-label={`${t("search.placeholder")} ${index + 1}`}
                />
              </div>
              <button
                type="button"
                className="btn btn-square btn-ghost btn-sm text-base-content/40 hover:text-error"
                onClick={() => removeRow(index)}
                disabled={disabled || values.length === 1}
                aria-label={t("search.removeRow")}
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
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-sm mt-3 gap-1 self-start text-primary hover:bg-primary/10"
        onClick={addRow}
        disabled={disabled}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t("search.addRow")}
      </button>
    </section>
  );
}

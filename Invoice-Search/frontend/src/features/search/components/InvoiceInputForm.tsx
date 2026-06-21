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
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">{t("search.title")}</h2>
        <p className="text-sm text-base-content/70">{t("search.pasteHint")}</p>

        <div className="flex flex-col gap-2">
          {values.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                className={`input input-bordered w-full ${
                  isRowInvalid(value) ? "input-error" : ""
                }`}
                placeholder={t("search.placeholder")}
                value={value}
                disabled={disabled}
                onChange={(event) => updateRow(index, event.target.value)}
                onPaste={handlePaste(index)}
                aria-invalid={isRowInvalid(value)}
                aria-label={`${t("search.placeholder")} ${index + 1}`}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeRow(index)}
                disabled={disabled || values.length === 1}
                aria-label={t("search.removeRow")}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm mt-2 self-start"
          onClick={addRow}
          disabled={disabled}
        >
          + {t("search.addRow")}
        </button>
      </div>
    </div>
  );
}

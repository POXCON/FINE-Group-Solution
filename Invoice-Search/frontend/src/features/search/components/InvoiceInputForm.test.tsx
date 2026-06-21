import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoiceInputForm } from "./InvoiceInputForm";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderForm(values: string[], onChange: (v: string[]) => void, disabled = false) {
  return render(
    <InvoiceInputForm values={values} onChange={onChange} disabled={disabled} />,
  );
}

describe("InvoiceInputForm", () => {
  it("renders one input per value", () => {
    const onChange = vi.fn();
    renderForm(["T1234567890123", "T9876543210987"], onChange);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
  });

  it("calls onChange when input value changes", async () => {
    const onChange = vi.fn();
    renderForm([""], onChange);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "T");
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange with new row when add button clicked", async () => {
    const onChange = vi.fn();
    renderForm(["T1234567890123"], onChange);
    const addButton = screen.getByText(/search.addRow/);
    await userEvent.click(addButton);
    expect(onChange).toHaveBeenCalledWith(["T1234567890123", ""]);
  });

  it("calls onChange without row when remove button clicked", async () => {
    const onChange = vi.fn();
    renderForm(["T1234567890123", "T9876543210987"], onChange);
    const removeButtons = screen.getAllByLabelText("search.removeRow");
    await userEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(["T9876543210987"]);
  });

  it("prevents removing the last row (replaces with empty string)", async () => {
    const onChange = vi.fn();
    renderForm(["T1234567890123"], onChange);
    const removeButton = screen.getByLabelText("search.removeRow");
    expect(removeButton).toBeDisabled();
  });

  it("shows error style for invalid invoice number", () => {
    const onChange = vi.fn();
    renderForm(["INVALID"], onChange);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("input-error");
  });

  it("does not show error style for empty input", () => {
    const onChange = vi.fn();
    renderForm([""], onChange);
    const input = screen.getByRole("textbox");
    expect(input.className).not.toContain("input-error");
  });

  it("does not show error style for valid invoice number", () => {
    const onChange = vi.fn();
    renderForm(["T1234567890123"], onChange);
    const input = screen.getByRole("textbox");
    expect(input.className).not.toContain("input-error");
  });

  it("disables inputs when disabled prop is true", () => {
    const onChange = vi.fn();
    renderForm([""], onChange, true);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("handles bulk paste and splits on newlines", async () => {
    const onChange = vi.fn();
    renderForm([""], onChange);
    const input = screen.getByRole("textbox");

    const pastedText = "T1234567890123\nT9876543210987\nT1111111111111";
    const clipboardData = {
      getData: vi.fn().mockReturnValue(pastedText),
    };

    fireEvent.paste(input, { clipboardData });
    expect(onChange).toHaveBeenCalledWith(["T1234567890123", "T9876543210987", "T1111111111111"]);
  });

  it("handles bulk paste and splits on commas", async () => {
    const onChange = vi.fn();
    renderForm([""], onChange);
    const input = screen.getByRole("textbox");

    const pastedText = "T1234567890123,T9876543210987";
    const clipboardData = {
      getData: vi.fn().mockReturnValue(pastedText),
    };

    fireEvent.paste(input, { clipboardData });
    expect(onChange).toHaveBeenCalledWith(["T1234567890123", "T9876543210987"]);
  });

  it("does not intercept paste for single value", async () => {
    const onChange = vi.fn();
    renderForm(["existing"], onChange);
    const input = screen.getByRole("textbox");

    const pastedText = "T1234567890123";
    const clipboardData = {
      getData: vi.fn().mockReturnValue(pastedText),
    };
    const preventDefaultSpy = vi.fn();

    fireEvent.paste(input, {
      clipboardData,
      preventDefault: preventDefaultSpy,
    });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

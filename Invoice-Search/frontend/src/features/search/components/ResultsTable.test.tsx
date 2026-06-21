import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsTable } from "./ResultsTable";
import type { InvoiceSearchRow } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const makeRow = (id: string, override?: Partial<InvoiceSearchRow>): InvoiceSearchRow => ({
  id,
  invoiceNumber: `T${id}11111111111`.slice(0, 14),
  companyName: `Company ${id}`,
  address: `Address ${id}`,
  tradeName: null,
  invoiceCheck: null,
  ...override,
});

describe("ResultsTable", () => {
  it("shows empty state when no rows", () => {
    render(<ResultsTable rows={[]} onDeleteRow={vi.fn()} />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders a row for each item", () => {
    const rows = [makeRow("1"), makeRow("2")];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);
    expect(screen.getByText("Company 1")).toBeDefined();
    expect(screen.getByText("Company 2")).toBeDefined();
  });

  it("shows dash for null tradeName", () => {
    const rows = [makeRow("1", { tradeName: null })];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows tradeName when present", () => {
    const rows = [makeRow("1", { tradeName: "My Trade Name" })];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);
    expect(screen.getByText("My Trade Name")).toBeDefined();
  });

  it("shows registered badge when invoiceCheck is true", () => {
    const rows = [makeRow("1", { invoiceCheck: true })];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);
    expect(screen.getByText("search.registered")).toBeDefined();
  });

  it("shows not registered badge when invoiceCheck is false", () => {
    const rows = [makeRow("1", { invoiceCheck: false })];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);
    expect(screen.getByText("search.notRegistered")).toBeDefined();
  });

  it("shows dash for null invoiceCheck", () => {
    const rows = [makeRow("1", { invoiceCheck: null })];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("calls onDeleteRow with row id when delete clicked", async () => {
    const onDeleteRow = vi.fn();
    const rows = [makeRow("1")];
    render(<ResultsTable rows={rows} onDeleteRow={onDeleteRow} />);
    const deleteButton = screen.getByLabelText(/common.delete/);
    await userEvent.click(deleteButton);
    expect(onDeleteRow).toHaveBeenCalledWith("1");
  });

  it("sorts by invoiceNumber when column header clicked", async () => {
    const rows = [
      makeRow("z", { invoiceNumber: "T9999999999999", companyName: "Z Company" }),
      makeRow("a", { invoiceNumber: "T1111111111111", companyName: "A Company" }),
    ];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);

    const allCells = screen.getAllByRole("cell");
    const invoiceNumberCell = allCells[0];
    expect(invoiceNumberCell.textContent).toBe("T1111111111111");
  });

  it("toggles sort direction when same column header clicked twice", async () => {
    const rows = [
      makeRow("a", { invoiceNumber: "T1111111111111", companyName: "A Company" }),
      makeRow("z", { invoiceNumber: "T9999999999999", companyName: "Z Company" }),
    ];
    render(<ResultsTable rows={rows} onDeleteRow={vi.fn()} />);

    const invoiceNumberHeader = screen.getByRole("button", { name: /search.column.invoiceNumber/ });
    await userEvent.click(invoiceNumberHeader);

    const allCells = screen.getAllByRole("cell");
    expect(allCells[0].textContent).toBe("T9999999999999");
  });
});

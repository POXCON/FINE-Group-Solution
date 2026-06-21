import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildCsv, downloadCsv } from "./csv";

describe("buildCsv", () => {
  it("builds CSV with headers and rows", () => {
    const result = buildCsv(["Name", "Age"], [["Alice", "30"], ["Bob", "25"]]);
    expect(result).toBe("Name,Age\nAlice,30\nBob,25");
  });

  it("handles empty rows", () => {
    const result = buildCsv(["Name", "Age"], []);
    expect(result).toBe("Name,Age");
  });

  it("escapes commas in values", () => {
    const result = buildCsv(["Company"], [["Smith, Inc."]]);
    expect(result).toBe('Company\n"Smith, Inc."');
  });

  it("escapes double quotes in values", () => {
    const result = buildCsv(["Name"], [['He said "hello"']]);
    expect(result).toBe('Name\n"He said ""hello"""');
  });

  it("escapes newlines in values", () => {
    const result = buildCsv(["Note"], [["Line1\nLine2"]]);
    expect(result).toBe('Note\n"Line1\nLine2"');
  });

  it("handles simple Japanese characters", () => {
    const result = buildCsv(["会社名"], [["株式会社テスト"]]);
    expect(result).toBe("会社名\n株式会社テスト");
  });
});

describe("downloadCsv", () => {
  beforeEach(() => {
    const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    const mockRevokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: mockCreateObjectURL, writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: mockRevokeObjectURL, writable: true });
  });

  it("creates a link and triggers click", () => {
    const mockClick = vi.fn();
    const mockLink = { href: "", download: "", click: mockClick } as unknown as HTMLAnchorElement;
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink);

    downloadCsv("test,data", "test.csv");

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.download).toBe("test.csv");
    expect(mockClick).toHaveBeenCalled();
    createElementSpy.mockRestore();
  });
});

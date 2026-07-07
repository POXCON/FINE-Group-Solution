import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import { ConsistencyCheckPage } from "./ConsistencyCheckPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/auth/hooks/useAuthContext", () => ({
  useAuth: () => ({ user: { email: "test@example.com", roles: ["admin"] } }),
}));

vi.mock("../hooks/useConsistencyCheck", () => ({
  useConsistencyCheck: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
}));

function makeCsvFile(name = "dropped.csv"): File {
  return new File(["インボイス番号,会社名,住所\n"], name, { type: "text/csv" });
}

describe("ConsistencyCheckPage drag-and-drop", () => {
  it("prevents the browser default on dragOver so the file is not opened", () => {
    render(<ConsistencyCheckPage />);
    const dropzone = screen.getByTestId("csv-dropzone");

    const dragOver = createEvent.dragOver(dropzone, {
      dataTransfer: { files: [makeCsvFile()] },
    });
    fireEvent(dropzone, dragOver);

    expect(dragOver.defaultPrevented).toBe(true);
  });

  it("attaches the dropped file and prevents default on drop", () => {
    render(<ConsistencyCheckPage />);
    const dropzone = screen.getByTestId("csv-dropzone");
    const file = makeCsvFile("orders.csv");

    const drop = createEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    fireEvent(dropzone, drop);

    expect(drop.defaultPrevented).toBe(true);
    // 選択ファイル名が表示される（添付された）
    expect(screen.getByText(/orders\.csv/)).toBeDefined();
  });

  it("ignores a drop with no files", () => {
    render(<ConsistencyCheckPage />);
    const dropzone = screen.getByTestId("csv-dropzone");

    const drop = createEvent.drop(dropzone, { dataTransfer: { files: [] } });
    fireEvent(dropzone, drop);

    expect(drop.defaultPrevented).toBe(true);
    expect(screen.queryByText(/\.csv/)).toBeNull();
  });
});

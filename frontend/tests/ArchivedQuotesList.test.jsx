import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArchivedQuotesList from "../src/components/admin/ArchivedQuotesList.jsx";

vi.mock("../src/api/client.js", () => ({
  getSavedQuotes: vi.fn(),
  deleteSavedQuote: vi.fn(),
  getSalespersons: vi.fn(),
}));

import { getSavedQuotes, deleteSavedQuote, getSalespersons } from "../src/api/client.js";

const ALL_ROWS = [
  {
    id: 1,
    clientName: "مصنع Alpha",
    date: "2026-06-01T12:00:00.000Z",
    totalAmount: 135000,
    salespersonId: 1,
    salespersonName: "أ. مصطفى",
    referenceNumber: "EMPL-001",
  },
  {
    id: 2,
    clientName: "مصنع Beta",
    date: "2026-06-20T12:00:00.000Z",
    totalAmount: 295000,
    salespersonId: 2,
    salespersonName: "أ. أحمد",
    referenceNumber: "EMPL-002",
  },
];

const SALESPERSONS = [
  { id: 1, name: "أ. مصطفى" },
  { id: 2, name: "أ. أحمد" },
];

describe("ArchivedQuotesList filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSalespersons.mockResolvedValue({ data: SALESPERSONS });
    getSavedQuotes.mockImplementation(async (_key, filters = {}) => {
      let rows = [...ALL_ROWS];
      if (filters.salespersonId) {
        rows = rows.filter((r) => String(r.salespersonId) === String(filters.salespersonId));
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        rows = rows.filter((r) => new Date(r.date).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        rows = rows.filter((r) => new Date(r.date).getTime() <= end.getTime());
      }
      return { data: rows };
    });
  });

  it("renders all archive rows on initial load", async () => {
    render(<ArchivedQuotesList adminKey="test-key" onEdit={vi.fn()} onCreateNew={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("مصنع Alpha")).toBeInTheDocument();
      expect(screen.getByText("مصنع Beta")).toBeInTheDocument();
    });
  });

  it("requests filtered data when salesperson dropdown changes", async () => {
    const user = userEvent.setup();
    render(<ArchivedQuotesList adminKey="test-key" onEdit={vi.fn()} onCreateNew={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("مصنع Beta")).toBeInTheDocument());

    const select = screen.getByLabelText("مسؤول البيع");
    await user.selectOptions(select, "1");

    await waitFor(() => {
      expect(getSavedQuotes).toHaveBeenCalledWith(
        "test-key",
        expect.objectContaining({ salespersonId: "1" })
      );
      expect(screen.getByText("مصنع Alpha")).toBeInTheDocument();
      expect(screen.queryByText("مصنع Beta")).not.toBeInTheDocument();
    });
  });

  it("updates table when date range filters are applied", async () => {
    const user = userEvent.setup();
    render(<ArchivedQuotesList adminKey="test-key" onEdit={vi.fn()} onCreateNew={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("مصنع Alpha")).toBeInTheDocument());

    await user.type(screen.getByLabelText("من تاريخ"), "2026-06-15");

    await waitFor(() => {
      expect(getSavedQuotes).toHaveBeenCalledWith(
        "test-key",
        expect.objectContaining({ startDate: "2026-06-15" })
      );
      expect(screen.queryByText("مصنع Alpha")).not.toBeInTheDocument();
      expect(screen.getByText("مصنع Beta")).toBeInTheDocument();
    });
  });

  it("shows clear filters control when filters are active", async () => {
    const user = userEvent.setup();
    render(<ArchivedQuotesList adminKey="test-key" onEdit={vi.fn()} onCreateNew={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("مصنع Alpha")).toBeInTheDocument());

    const clearBtn = screen.getByRole("button", { name: /مسح الفلاتر/i });
    expect(clearBtn.className).not.toMatch(/archive-filter-clear--visible/);

    await user.selectOptions(screen.getByLabelText("مسؤول البيع"), "2");

    await waitFor(() => {
      expect(clearBtn.className).toMatch(/archive-filter-clear--visible/);
    });

    await user.click(clearBtn);

    await waitFor(() => {
      expect(getSavedQuotes).toHaveBeenLastCalledWith("test-key", expect.objectContaining({}));
      expect(screen.getByText("مصنع Alpha")).toBeInTheDocument();
      expect(screen.getByText("مصنع Beta")).toBeInTheDocument();
    });
  });

  it("shows empty state with create action when archive is empty", async () => {
    getSavedQuotes.mockResolvedValue({ data: [] });
    const onCreateNew = vi.fn();

    render(<ArchivedQuotesList adminKey="test-key" onEdit={vi.fn()} onCreateNew={onCreateNew} />);

    await waitFor(() => {
      expect(screen.getByText(/الأرشيف فارغ/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /إنشاء عرض سعر جديد/i }));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("removes deleted offer from the table without a full page reload", async () => {
    const user = userEvent.setup();
    deleteSavedQuote.mockResolvedValue({ success: true });
    getSavedQuotes.mockResolvedValue({ data: ALL_ROWS });

    render(<ArchivedQuotesList adminKey="test-key" onEdit={vi.fn()} onCreateNew={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("مصنع Alpha")).toBeInTheDocument());

    const alphaRow = screen.getByText("مصنع Alpha").closest("tr");
    await user.click(within(alphaRow).getByRole("button", { name: /حذف/i }));
    await user.click(screen.getByRole("button", { name: /حذف نهائي/i }));

    await waitFor(() => {
      expect(deleteSavedQuote).toHaveBeenCalledWith(1, "test-key");
      expect(screen.queryByText("مصنع Alpha")).not.toBeInTheDocument();
      expect(screen.getByText("مصنع Beta")).toBeInTheDocument();
    });
  });
});

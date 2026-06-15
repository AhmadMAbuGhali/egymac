import { describe, it, expect } from "vitest";
import { filterArchiveRows } from "../../shared/archiveFilters.js";

const SAMPLE_ROWS = [
  {
    id: 1,
    clientName: "Client A",
    date: "2026-06-01T10:00:00.000Z",
    totalAmount: 100000,
    salespersonId: 1,
    salespersonName: "Rep One",
  },
  {
    id: 2,
    clientName: "Client B",
    date: "2026-06-15T10:00:00.000Z",
    totalAmount: 200000,
    salespersonId: 2,
    salespersonName: "Rep Two",
  },
  {
    id: 3,
    clientName: "Client C",
    date: "2026-07-01T10:00:00.000Z",
    totalAmount: 300000,
    salespersonId: 1,
    salespersonName: "Rep One",
  },
];

describe("filterArchiveRows", () => {
  it("returns all rows when no filters applied", () => {
    expect(filterArchiveRows(SAMPLE_ROWS, {})).toHaveLength(3);
  });

  it("filters by salespersonId", () => {
    const filtered = filterArchiveRows(SAMPLE_ROWS, { salespersonId: "2" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].clientName).toBe("Client B");
  });

  it("filters by startDate inclusive", () => {
    const filtered = filterArchiveRows(SAMPLE_ROWS, { startDate: "2026-06-10" });
    expect(filtered.map((r) => r.id)).toEqual([3, 2]);
  });

  it("filters by endDate inclusive through end of day", () => {
    const filtered = filterArchiveRows(SAMPLE_ROWS, { endDate: "2026-06-15" });
    expect(filtered.map((r) => r.id)).toEqual([2, 1]);
  });

  it("combines salesperson and date range filters", () => {
    const filtered = filterArchiveRows(SAMPLE_ROWS, {
      salespersonId: "1",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });
});

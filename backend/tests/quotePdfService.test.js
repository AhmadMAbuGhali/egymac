import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("quotePdfService (unit)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.QUOTE_PAYLOAD_MAX_BYTES = String(48 * 1024 * 1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildQuotePdfBuffer rejects oversized payload before PDF generation", async () => {
    process.env.QUOTE_PAYLOAD_MAX_BYTES = "512";

    vi.doMock("../utils/generateFreeFormQuotePdf.js", () => ({
      generateFreeFormQuotePdf: vi.fn(),
      closePdfBrowser: vi.fn(),
    }));

    const { buildQuotePdfBuffer } = await import("../utils/quotePdfService.js");

    await expect(
      buildQuotePdfBuffer({
        clientName: "Huge",
        greeting: "x".repeat(2000),
      })
    ).rejects.toMatchObject({ statusCode: 413 });
  });

  it("buildQuotePdfBuffer returns valid %PDF- buffer when generator succeeds", async () => {
    const fakePdf = Buffer.from("%PDF-1.4 fake content padding ".repeat(80));

    vi.doMock("../utils/generateFreeFormQuotePdf.js", () => ({
      generateFreeFormQuotePdf: vi.fn().mockResolvedValue(fakePdf),
      closePdfBrowser: vi.fn(),
    }));

    const { buildQuotePdfBuffer } = await import("../utils/quotePdfService.js");

    const quote = {
      clientName: "Egy Mac Test",
      referenceNumber: "TEST-001",
      date: "June 11, 2026",
      greeting: "Test greeting",
      technicalSpecs: [{ id: 1, serial: "1", parameter: "A", value: "B" }],
      commercialTerms: [{ id: 1, serial: "1", termKey: "Price", termValue: "5000" }],
      signatures: [
        { id: 1, title: "Sales", name: "Rep" },
        { id: 2, title: "Exec", name: "Exec" },
        { id: 3, title: "GM", name: "GM" },
      ],
      companyFooter: {
        companyName: "EGY MAC",
        headquartersAr: "Cairo",
        factoryAr: "Giza",
        website: "egymac.net",
        phone: "+201228004646",
      },
    };

    const { pdfBuffer, normalized } = await buildQuotePdfBuffer(quote, "compact");
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(normalized.clientName).toBe("Egy Mac Test");
  });
});

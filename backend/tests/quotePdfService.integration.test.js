import { describe, it, expect, afterAll } from "vitest";

const minimalQuote = {
  clientName: "Integration Test Client",
  referenceNumber: "INT-2026-001",
  date: "June 11, 2026",
  greeting: "Integration test quote",
  technicalSpecs: [{ id: 1, serial: "1", parameter: "Type", value: "Block" }],
  commercialTerms: [{ id: 1, serial: "1", termKey: "Price", termValue: "10,000 EGP" }],
  signatures: [
    { id: 1, title: "مسؤول البيع", name: "Test Rep" },
    { id: 2, title: "التنفيذ", name: "Exec" },
    { id: 3, title: "GM", name: "GM" },
  ],
  companyFooter: {
    companyName: "EGY MAC MACHINE",
    headquartersAr: "Cairo",
    factoryAr: "Giza",
    website: "egymac.net",
    phone: "+201228004646",
  },
};

describe("quotePdfService Puppeteer integration", () => {
  afterAll(async () => {
    const { closePdfBrowser } = await import("../utils/generateFreeFormQuotePdf.js");
    await closePdfBrowser();
  });

  it("generates real %PDF- bytes via browser pool", async () => {
    process.env.QUOTE_PAYLOAD_MAX_BYTES = String(48 * 1024 * 1024);

    const { buildQuotePdfBuffer } = await import("../utils/quotePdfService.js");
    const { pdfBuffer } = await buildQuotePdfBuffer(minimalQuote, "compact");

    expect(pdfBuffer.length).toBeGreaterThan(1024);
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  }, 90_000);
});

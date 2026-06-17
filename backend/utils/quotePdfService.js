import { readJson } from "./jsonStore.js";
import { normalizeFreeFormQuote } from "./freeFormQuoteTemplate.js";
import { assertQuotePayloadWithinLimit } from "./quotePayloadGuard.js";
import {
  buildQuotationFilename,
  buildQuotationFilenameUtf8,
  contentDispositionAttachment,
} from "./freeFormQuoteHtml.js";

const FILE = "saved_quotes.json";

export async function loadSavedQuoteById(id) {
  const quotes = await readJson(FILE, []);
  const quote = quotes.find((q) => String(q.id) === String(id));
  if (!quote) {
    const err = new Error("Quote not found");
    err.statusCode = 404;
    throw err;
  }
  return normalizeFreeFormQuote(quote);
}

export async function buildQuotePdfBuffer(quote, printMode = "spanned") {
  const normalized = normalizeFreeFormQuote(quote);
  assertQuotePayloadWithinLimit(normalized);
  const { generateFreeFormQuotePdf } = await import("./generateFreeFormQuotePdf.js");
  const rawPdf = await generateFreeFormQuotePdf(normalized, printMode);
  const pdfBuffer = Buffer.isBuffer(rawPdf) ? rawPdf : Buffer.from(rawPdf);

  if (pdfBuffer.length < 1024 || pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Generated PDF failed integrity validation");
  }

  return { pdfBuffer, normalized };
}

export async function buildQuotePdfBufferById(id, printMode = "spanned") {
  const quote = await loadSavedQuoteById(id);
  return buildQuotePdfBuffer(quote, printMode);
}

export function sendQuotePdfResponse(res, pdfBuffer, quote) {
  const filename = buildQuotationFilename(quote);
  const utf8Filename = buildQuotationFilenameUtf8(quote);

  res.status(200);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", pdfBuffer.length);
  res.setHeader("Content-Disposition", contentDispositionAttachment(filename, utf8Filename));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(Buffer.from(pdfBuffer));
}

export function handleQuotePdfError(res, err) {
  console.error("PDF generation error:", err);
  if (res.headersSent) {
    res.destroy(err);
    return;
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "PDF generation failed",
  });
}

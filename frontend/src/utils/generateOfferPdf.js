import { API_BASE as API } from "../api/base.js";

function sanitizeFilenamePart(value, fallback) {
  const cleaned = String(value || fallback)
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);
  return cleaned || fallback;
}

function buildQuotationFilename(clientName) {
  return `Egy_Mac_Quotation_${sanitizeFilenamePart(clientName, "Client")}.pdf`;
}

function isPdfBytes(buffer) {
  if (!buffer || buffer.byteLength < 5) return false;
  const header = new TextDecoder().decode(buffer.slice(0, 5));
  return header === "%PDF-";
}

async function readApiErrorMessage(res) {
  const text = await res.text().catch(() => "");
  if (!text.trim()) {
    if (res.status === 413) {
      return "Request payload too large. Save the offer and download PDF again (uses id-only flow).";
    }
    return res.status === 502 || res.status === 503
      ? "Backend server is unavailable. Ensure the API is running on port 5001."
      : null;
  }
  try {
    const data = JSON.parse(text);
    return data.message || data.error || null;
  } catch {
    return text.slice(0, 200);
  }
}

function triggerBrowserDownload(buffer, filename) {
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Download PDF by archived quote id — no quote body over the wire (C1 hardening).
 */
export async function downloadOfferPdfById({ quoteId, printMode = "spanned", adminKey, clientName }) {
  if (quoteId == null || quoteId === "") {
    throw new Error("Saved quote id is required. Save the offer before downloading PDF.");
  }
  if (!adminKey) {
    throw new Error("Admin authentication required.");
  }

  const mode = printMode === "compact" ? "compact" : "spanned";
  const qs = new URLSearchParams({ printMode: mode });
  const res = await fetch(`${API}/quotations/${quoteId}/pdf?${qs}`, {
    method: "GET",
    headers: { "X-Admin-Key": adminKey },
  });

  if (!res.ok) {
    const message = await readApiErrorMessage(res);
    throw new Error(message || "PDF generation failed");
  }

  const buffer = await res.arrayBuffer();
  if (!isPdfBytes(buffer)) {
    const peek = new TextDecoder().decode(buffer.slice(0, 64)).trimStart();
    if (peek.startsWith("<!DOCTYPE") || peek.startsWith("<html")) {
      throw new Error(
        "PDF API route not reached (received HTML instead of PDF). Redeploy the latest frontend build."
      );
    }
    throw new Error("Server returned a corrupted PDF. Please retry.");
  }

  triggerBrowserDownload(buffer, buildQuotationFilename(clientName));
}

/**
 * @deprecated Prefer save-then-download via downloadOfferPdfById.
 * Lightweight POST fallback: { id, printMode } only.
 */
export async function downloadOfferPdf({ quoteId, printMode, adminKey, clientName, quote }) {
  if (quoteId != null && quoteId !== "") {
    return downloadOfferPdfById({ quoteId, printMode, adminKey, clientName });
  }

  if (!adminKey) {
    throw new Error("Admin authentication required.");
  }

  if (quote?.id) {
    return downloadOfferPdfById({
      quoteId: quote.id,
      printMode,
      adminKey,
      clientName: clientName ?? quote.clientName,
    });
  }

  throw new Error("Save the offer first, then download PDF.");
}

export { buildQuotationFilename };

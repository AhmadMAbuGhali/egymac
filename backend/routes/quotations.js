import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";
import { createEmptyFreeFormQuote, normalizeFreeFormQuote } from "../utils/freeFormQuoteTemplate.js";
import {
  buildQuotePdfBuffer,
  buildQuotePdfBufferById,
  sendQuotePdfResponse,
  handleQuotePdfError,
} from "../utils/quotePdfService.js";
import {
  upsertArchivedQuote,
  listArchivedQuotes,
  deleteArchivedQuote,
  deleteSavedQuote,
  migrateSavedQuotesToArchive,
  SAVED_FILE,
} from "../utils/quoteArchive.js";

const router = Router();

function parsePrintMode(value) {
  return value === "compact" ? "compact" : "spanned";
}

async function salespersonNameMap() {
  const rows = await readJson("salespersons.json", []);
  const map = {};
  for (const row of rows) {
    if (row?.id != null) map[String(row.id)] = row;
  }
  return map;
}

function summarizeArchiveRow(row, spMap = {}) {
  const sp = row.salespersonId != null ? spMap[String(row.salespersonId)] : null;
  return {
    id: row.id,
    clientName: row.clientName || "",
    date: row.date,
    totalAmount: row.totalAmount ?? 0,
    salespersonId: row.salespersonId ?? null,
    salespersonName: sp?.name || "",
    referenceNumber: row.referenceNumber || "",
  };
}

/** GET /api/quotations — archived offers list with optional filters */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const filters = {
      salespersonId: req.query.salespersonId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const rows = await listArchivedQuotes(filters);
    const spMap = await salespersonNameMap();
    const data = rows.map((r) => summarizeArchiveRow(r, spMap));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/quotations/template — empty scaffold */
router.get("/template", requireAdmin, (_req, res) => {
  res.json({ success: true, data: createEmptyFreeFormQuote() });
});

/**
 * POST /api/quotations/generate-pdf
 * Preferred: { id, printMode } — server loads quote from disk (no heavy client payload).
 */
router.post("/generate-pdf", requireAdmin, async (req, res) => {
  try {
    const { id, quote, printMode = "spanned" } = req.body || {};
    const mode = parsePrintMode(printMode);

    let pdfBuffer;
    let normalized;

    if (id != null && id !== "") {
      ({ pdfBuffer, normalized } = await buildQuotePdfBufferById(id, mode));
    } else if (quote && typeof quote === "object") {
      ({ pdfBuffer, normalized } = await buildQuotePdfBuffer(quote, mode));
    } else {
      return res.status(400).json({
        success: false,
        message: "Quote id required. Save the offer first, then request PDF by id.",
      });
    }

    await upsertArchivedQuote({ ...normalized, archivedAt: new Date().toISOString() });
    sendQuotePdfResponse(res, pdfBuffer, normalized);
  } catch (err) {
    handleQuotePdfError(res, err);
  }
});

/**
 * GET /api/quotations/:id/pdf?printMode=compact|spanned
 */
router.get("/:id/pdf", requireAdmin, async (req, res) => {
  try {
    const mode = parsePrintMode(req.query.printMode);
    const { pdfBuffer, normalized } = await buildQuotePdfBufferById(req.params.id, mode);
    await upsertArchivedQuote({ ...normalized, archivedAt: new Date().toISOString() });
    sendQuotePdfResponse(res, pdfBuffer, normalized);
  } catch (err) {
    handleQuotePdfError(res, err);
  }
});

/** GET /api/quotations/:id — load one archived offer (full payload) */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    await migrateSavedQuotesToArchive();
    const quotes = await readJson(SAVED_FILE, []);
    let quote = quotes.find((q) => String(q.id) === String(req.params.id));
    if (!quote) {
      const archived = await listArchivedQuotes({});
      const row = archived.find((r) => String(r.id) === String(req.params.id));
      quote = row?.payload;
    }
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });
    res.json({ success: true, data: normalizeFreeFormQuote(quote) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/quotations/save — create or update archived offer */
router.post("/save", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, message: "Invalid quote payload" });
    }

    const normalized = normalizeFreeFormQuote(payload);
    const spMap = await salespersonNameMap();
    if (normalized.salespersonId != null && spMap[String(normalized.salespersonId)]) {
      normalized.salespersonName = spMap[String(normalized.salespersonId)].name;
    }
    const withSignatures = normalizeFreeFormQuote({
      ...normalized,
      salespersonName: normalized.salespersonName,
    });
    const quotes = await readJson(SAVED_FILE, []);
    const savedAt = new Date().toISOString();

    let saved;
    if (payload.id) {
      const idx = quotes.findIndex((q) => String(q.id) === String(payload.id));
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Quote not found for update" });
      }
      saved = { ...withSignatures, id: payload.id, savedAt };
      quotes[idx] = saved;
    } else {
      saved = { ...withSignatures, id: nextId(quotes), savedAt };
      quotes.push(saved);
    }

    await writeJson(SAVED_FILE, quotes);
    await upsertArchivedQuote({ ...saved, archivedAt: savedAt });

    const status = payload.id ? 200 : 201;
    res.status(status).json({
      success: true,
      data: saved,
      message: payload.id ? "Quote updated" : "Quote saved",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** DELETE /api/quotations/:id — purge from saved + archive stores */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const quotes = await readJson(SAVED_FILE, []);
    const inSaved = quotes.some((q) => String(q.id) === String(req.params.id));
    const archived = await listArchivedQuotes({});
    const inArchive = archived.some((r) => String(r.id) === String(req.params.id));

    if (!inSaved && !inArchive) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    if (inSaved) await deleteSavedQuote(req.params.id);
    if (inArchive) await deleteArchivedQuote(req.params.id);

    res.json({ success: true, message: "Quote deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

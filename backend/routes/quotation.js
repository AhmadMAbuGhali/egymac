import { Router } from "express";
import { publicErrorMessage } from "../utils/safeError.js";
import { contentDispositionAttachment } from "../utils/freeFormQuoteHtml.js";
import multer from "multer";
import { requireAdmin } from "../middleware/adminAuth.js";
import { parsePdfTextToQuotation } from "../utils/pdfParser.js";
import { generateQuotationPdf } from "../utils/pdfGenerator.js";
import { computeTotals, createEmptyQuotation } from "../utils/quotationTemplate.js";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";

const router = Router();

/** Lazy-load pdf-parse so catalog/site-content routes work on Vercel (no canvas at cold start). */
async function extractPdfText(buffer) {
  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  } catch (err) {
    console.warn("[Quotation] pdf-parse unavailable:", err.message);
    return "";
  }
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

const HISTORY_FILE = "quotations.json";

/**
 * POST /api/quotation/parse
 * Upload existing quotation PDF → extract text → return editable form structure.
 * Admin secured.
 */
router.post("/parse", requireAdmin, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    let rawText = "";

    try {
      rawText = await extractPdfText(req.file.buffer);
    } catch (parseErr) {
      console.warn("[Quotation] pdf-parse failed, using mock structure:", parseErr.message);
      rawText = "";
    }

    // If PDF has no extractable text (scanned), return template with mock flag
    const quotation =
      rawText.trim().length > 20
        ? parsePdfTextToQuotation(rawText)
        : {
            ...createEmptyQuotation(),
            client: {
              companyName: "Imported from PDF (scanned — please edit manually)",
              projectLocation: "",
              attentionTo: "",
            },
            parseMeta: {
              source: "pdf-scanned-or-empty",
              rawTextLength: rawText.length,
              extractedAt: new Date().toISOString(),
            },
          };

    res.json({
      success: true,
      message: "PDF processed successfully",
      data: quotation,
      rawTextPreview: rawText.slice(0, 500),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

/**
 * POST /api/quotation/generate
 * Accept quotation JSON → return generated PDF binary.
 * Admin secured.
 */
router.post("/generate", requireAdmin, async (req, res) => {
  try {
    const quotation = computeTotals(req.body);

    if (!quotation.client?.companyName?.trim()) {
      return res.status(400).json({ success: false, message: "Client company name is required" });
    }

    if (!quotation.items?.length) {
      return res.status(400).json({ success: false, message: "At least one line item is required" });
    }

    const pdfBuffer = await generateQuotationPdf(quotation);

    // Persist to history (optional audit trail)
    try {
      const history = await readJson(HISTORY_FILE, []);
      history.unshift({
        id: nextId(history),
        referenceNumber: quotation.referenceNumber,
        companyName: quotation.client.companyName,
        grandTotal: quotation.grandTotal,
        generatedAt: new Date().toISOString(),
      });
      await writeJson(HISTORY_FILE, history.slice(0, 100));
    } catch {
      /* non-blocking */
    }

    const filename = `EgyMac-Offer-${quotation.referenceNumber || "draft"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));
    res.setHeader("Content-Disposition", contentDispositionAttachment(filename));
    res.end(Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer));
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

/** GET /api/quotation/template — empty form scaffold */
router.get("/template", requireAdmin, (_req, res) => {
  res.json({ success: true, data: createEmptyQuotation() });
});

export default router;

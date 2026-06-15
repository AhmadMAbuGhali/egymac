import { Router } from "express";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();
const FILE = "inquiries.json";
const VALID_STATUSES = new Set(["new", "in_progress", "resolved"]);

function normalizeInquiry(raw = {}) {
  return {
    ...raw,
    status: VALID_STATUSES.has(raw.status) ? raw.status : "new",
    internalNotes: Array.isArray(raw.internalNotes) ? raw.internalNotes : [],
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

router.post("/", async (req, res) => {
  try {
    const {
      productId,
      productName,
      companyName,
      contactPerson,
      phone,
      email,
      quantity,
      customizations,
    } = req.body;

    if (!companyName?.trim() || !contactPerson?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name, contact person, and email are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    const inquiries = await readJson(FILE, []);
    const now = new Date().toISOString();

    const inquiry = normalizeInquiry({
      id: nextId(inquiries),
      productId: productId || null,
      productName: productName?.trim() || "General Inquiry",
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone?.trim() || "",
      email: email.trim(),
      quantity: quantity?.trim() || "",
      customizations: customizations?.trim() || "",
      status: "new",
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
    });

    inquiries.unshift(inquiry);
    await writeJson(FILE, inquiries);

    res.status(201).json({
      success: true,
      message: "Quote request submitted. Our engineering team will respond within 24–48 hours.",
      data: { id: inquiry.id },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const inquiries = (await readJson(FILE, [])).map(normalizeInquiry);
    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const inquiries = await readJson(FILE, []);
    const inquiry = inquiries.find((q) => String(q.id) === String(req.params.id));
    if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });
    res.json({ success: true, data: normalizeInquiry(inquiry) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { status, note, internalNotes } = req.body || {};
    const inquiries = await readJson(FILE, []);
    const idx = inquiries.findIndex((q) => String(q.id) === String(req.params.id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    const current = normalizeInquiry(inquiries[idx]);
    const next = { ...current, updatedAt: new Date().toISOString() };

    if (status && VALID_STATUSES.has(status)) next.status = status;

    if (Array.isArray(internalNotes)) {
      next.internalNotes = internalNotes;
    } else if (note?.trim()) {
      next.internalNotes = [
        ...current.internalNotes,
        { id: nextId(current.internalNotes), body: note.trim(), createdAt: new Date().toISOString() },
      ];
    }

    inquiries[idx] = next;
    await writeJson(FILE, inquiries);
    res.json({ success: true, data: normalizeInquiry(next) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

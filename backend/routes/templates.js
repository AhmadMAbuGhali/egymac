import { Router } from "express";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  prepareTemplatePayload,
  resolveTemplatePayload,
} from "../utils/quoteTemplatePayload.js";

const router = Router();
const FILE = "quote_templates.json";

export const DEFAULT_TEMPLATES = [
  {
    id: 1,
    name: "Standard Machine Offer",
    nameAr: "عرض ماكينة قياسي",
    description: "Default bilingual technical + commercial tables for machinery quotes.",
    category: "machinery",
    templateStyle: "standard",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload: null,
  },
  {
    id: 2,
    name: "Premium Group Package",
    nameAr: "باقة مجموعة مميزة",
    description: "Replica layout with visual attachment slots for premium packages.",
    category: "premium",
    templateStyle: "replica",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload: null,
  },
];

function summarizeTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.nameAr || "",
    description: row.description || "",
    category: row.category || "general",
    templateStyle: row.templateStyle || "standard",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/", requireAdmin, async (_req, res) => {
  try {
    let templates = await readJson(FILE, DEFAULT_TEMPLATES);
    if (!templates.length) {
      templates = DEFAULT_TEMPLATES;
      await writeJson(FILE, templates);
    }
    res.json({ success: true, data: templates.map(summarizeTemplate) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const templates = await readJson(FILE, DEFAULT_TEMPLATES);
    const row = templates.find((t) => String(t.id) === String(req.params.id));
    if (!row) return res.status(404).json({ success: false, message: "Template not found" });

    const payload = resolveTemplatePayload(row);

    res.json({
      success: true,
      data: { ...summarizeTemplate(row), payload },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { id, name, nameAr, description, category, templateStyle, payload } = req.body || {};
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Template name is required." });
    }

    const templates = await readJson(FILE, DEFAULT_TEMPLATES);
    const now = new Date().toISOString();
    const cleanPayload = payload ? prepareTemplatePayload(payload) : null;

    if (!id && !cleanPayload) {
      return res.status(400).json({
        success: false,
        message:
          "Template payload is required. Build the offer in Price Offers, then use Save as Blueprint Template.",
      });
    }

    let saved;
    if (id) {
      const idx = templates.findIndex((t) => String(t.id) === String(id));
      if (idx === -1) return res.status(404).json({ success: false, message: "Template not found" });
      saved = {
        ...templates[idx],
        name: name.trim(),
        nameAr: nameAr?.trim() || "",
        description: description?.trim() || "",
        category: category?.trim() || "general",
        templateStyle: templateStyle || templates[idx].templateStyle || "standard",
        payload: cleanPayload ?? templates[idx].payload,
        updatedAt: now,
      };
      templates[idx] = saved;
    } else {
      saved = {
        id: nextId(templates),
        name: name.trim(),
        nameAr: nameAr?.trim() || "",
        description: description?.trim() || "",
        category: category?.trim() || "general",
        templateStyle: templateStyle || "standard",
        payload: cleanPayload,
        createdAt: now,
        updatedAt: now,
      };
      templates.push(saved);
    }

    await writeJson(FILE, templates);
    res.status(id ? 200 : 201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const templates = await readJson(FILE, DEFAULT_TEMPLATES);
    const next = templates.filter((t) => String(t.id) !== String(req.params.id));
    if (next.length === templates.length) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    await writeJson(FILE, next);
    res.status(200).json({ success: true, message: "Template deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

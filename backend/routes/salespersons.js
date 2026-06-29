import { Router } from "express";
import { publicErrorMessage } from "../utils/safeError.js";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { sanitizePlainText } from "../utils/sanitizeText.js";

const router = Router();
const FILE = "salespersons.json";

function normalizeSalesperson(row = {}) {
  return {
    id: row.id,
    name: sanitizePlainText(row.name, 128),
    active: row.active !== false,
    createdAt: row.createdAt || new Date().toISOString(),
  };
}

/** GET /api/salespersons — active sales team roster */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const rows = await readJson(FILE, []);
    const data = rows
      .map(normalizeSalesperson)
      .filter((r) => r.active !== false)
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

/** POST /api/salespersons — add salesperson */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = sanitizePlainText(req.body?.name, 128);
    if (!name) {
      return res.status(400).json({ success: false, message: "Salesperson name is required." });
    }

    const rows = await readJson(FILE, []);
    const duplicate = rows.find((r) => r.name === name && r.active !== false);
    if (duplicate) {
      return res.status(409).json({ success: false, message: "This salesperson already exists." });
    }

    const created = normalizeSalesperson({
      id: nextId(rows),
      name,
      active: true,
      createdAt: new Date().toISOString(),
    });
    rows.push(created);
    await writeJson(FILE, rows);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

/** DELETE /api/salespersons/:id — soft-remove salesperson */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const rows = await readJson(FILE, []);
    const idx = rows.findIndex((r) => String(r.id) === String(req.params.id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Salesperson not found" });
    }
    rows[idx] = { ...rows[idx], active: false };
    await writeJson(FILE, rows);
    res.json({ success: true, message: "Salesperson removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

export default router;

import { Router } from "express";
import { publicErrorMessage } from "../utils/safeError.js";
import { readJson, writeJson } from "../utils/jsonStore.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();
const FILE = "texts.json";

const DEFAULT_TEXTS = {
  hero: {
    en: {
      badge: "100% Fully Automated · German Engineering · Made in Egypt",
      headline: "Engineering Fully Automated Concrete Production Lines & Custom Heavy-Duty Molds —",
      headlineAccent: "From Conception to Complete Fabrication",
      headlineEnd: ", Overhauling, and Bespoke Re-manufacturing.",
      subtext: "Fully automated production lines and bespoke molds from absolute scratch — plus advanced repair and re-manufacturing for automated factories.",
      ctaPrimary: "Explore Service Catalog",
      ctaSecondary: "Request Engineering Quote",
    },
    ar: {
      badge: "آلي بالكامل 100% · هندسة ألمانية · صنع في مصر",
      headline: "هندسة خطوط إنتاج آلية وقوالب ثقيلة مخصصة —",
      headlineAccent: "من الفكرة إلى التصنيع الكامل",
      headlineEnd: " والصيانة وإعادة التصنيع.",
      subtext: "خطوط آلية بالكامل وقوالب مخصصة من الصفر — مع إصلاح وإعادة تصنيع للمصانع الآلية.",
      ctaPrimary: "استكشف فهرس الخدمات",
      ctaSecondary: "اطلب عرض هندسي",
    },
  },
  about: {
    en: {
      subtitle: "About Egy Mac",
      title: "Elite Automated Engineering — Not Manual, Not Generic",
      intro: "Egy Mac strictly engineers fully automated lines and bespoke heavy-duty molds — with repair, overhaul, and re-manufacturing capability.",
      mission: "End-to-end German-standard engineering fabricated in Egypt, restoring maximum efficiency when breakdowns threaten production uptime.",
    },
    ar: {
      subtitle: "عن إيجي ماك",
      title: "هندسة آلية متخصصة — لا حلول يدوية",
      intro: "إيجي ماك تصمم خطوط آلية بالكامل وقوالب ثقيلة مخصصة — مع إصلاح وإعادة تصنيع.",
      mission: "هندسة ألمانية متكاملة في مصر لاستعادة الكفاءة عند تعطل الإنتاج.",
    },
  },
};

/** GET /api/site-texts — public */
router.get("/", async (_req, res) => {
  try {
    const texts = await readJson(FILE, DEFAULT_TEXTS);
    res.json({ success: true, data: texts });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

/** PUT /api/site-texts — admin update hero + about copy */
router.put("/", requireAdmin, async (req, res) => {
  try {
    const current = await readJson(FILE, DEFAULT_TEXTS);
    const { hero, about } = req.body;

    const updated = {
      hero: hero ? { ...current.hero, ...hero } : current.hero,
      about: about ? { ...current.about, ...about } : current.about,
    };

    await writeJson(FILE, updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

export default router;

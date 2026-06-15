import { Router } from "express";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";
import { persistSiteImage } from "../utils/siteAssetStore.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();
const FILE = "site_content.json";

export const DEFAULT_SITE_CONTENT = {
  hero: {
    title: {
      ar: "هندسة خطوط إنتاج آلية وقوالب ثقيلة مخصصة",
      en: "Engineering Fully Automated Concrete Production Lines & Custom Heavy-Duty Molds",
    },
    subtitle: {
      ar: "خطوط آلية بالكامل وقوالب مخصصة من الصفر — مع إصلاح وإعادة تصنيع للمصانع الآلية.",
      en: "Fully automated production lines and bespoke molds from absolute scratch — plus advanced repair and re-manufacturing for automated factories.",
    },
    badgeText: {
      ar: "آلي بالكامل 100% · هندسة ألمانية · صنع في مصر",
      en: "100% Fully Automated · German Engineering · Made in Egypt",
    },
    ctaText: {
      ar: "استكشف فهرس الخدمات",
      en: "Explore Service Catalog",
    },
    backgroundImage: "",
  },
  about: {
    heading: {
      ar: "هندسة آلية متخصصة — لا حلول يدوية",
      en: "Elite Automated Engineering — Not Manual, Not Generic",
    },
    description: {
      ar: "إيجي ماك تصمم خطوط آلية بالكامل وقوالب ثقيلة مخصصة — مع إصلاح وإعادة تصنيع. هندسة ألمانية متكاملة في مصر لاستعادة الكفاءة عند تعطل الإنتاج.",
      en: "Egy Mac strictly engineers fully automated lines and bespoke heavy-duty molds — with repair, overhaul, and re-manufacturing capability. End-to-end German-standard engineering fabricated in Egypt.",
    },
    sectionImage: "",
  },
  features: [
    {
      id: 1,
      title: { ar: "خطوط آلية بالكامل", en: "Fully Automated Lines" },
      description: {
        ar: "نصمم خطوط إنتاج آلية متكاملة للبلوك والبلاط والبردورات — من المخطط إلى التصنيع والتركيب والتشغيل.",
        en: "We strictly engineer turnkey fully automated production lines for blocks, interlock, and curbstones — blueprint, fabrication, installation, and commissioning.",
      },
      icon: "Factory",
    },
    {
      id: 2,
      title: { ar: "تصنيع مخصص من الصفر", en: "Custom Fabrication from Scratch" },
      description: {
        ar: "قوالب وأجزاء فولاذية ثقيلة مصممة ومصنعة من الصفر حسب متطلبات مصنعك وواجهة الماكينة.",
        en: "Bespoke molds and heavy steel parts designed and manufactured from absolute zero based on your factory requirements and machine interface.",
      },
      icon: "Layers",
    },
    {
      id: 3,
      title: { ar: "صيانة وإعادة تصنيع حسب الطلب", en: "Bespoke Overhauling & Re-manufacturing" },
      description: {
        ar: "عند تعطل أو تآكل القوالب والمكونات الميكانيكية — نشخّص ونُصلح أو نعيد التصنيع من الصفر لاستعادة الكفاءة التشغيلية القصوى.",
        en: "When automated factories face breakdown, wear, or damage to molds and mechanical parts — we diagnose, overhaul, or entirely re-manufacture from scratch.",
      },
      icon: "Wrench",
    },
    {
      id: 4,
      title: { ar: "هندسة ألمانية موطّنة", en: "Localized German Engineering" },
      description: {
        ar: "منهجية تصميم ألمانية متقدمة منقولة ومتقنة للتصنيع المصري — موثوقة من أصحاب المصانع.",
        en: "Advanced German design methodology transferred and perfected for Egyptian manufacturing — trusted by B2B factory owners across the region.",
      },
      icon: "Globe2",
    },
  ],
  catalogTeaser: {
    label: { ar: "فهرس الخدمات", en: "Service Catalog" },
    heading: {
      ar: "خطوط آلية · تصنيع مخصص · إصلاح",
      en: "Automated Lines · Custom Fabrication · Repair",
    },
    ctaText: { ar: "استكشف فهرس الخدمات", en: "Explore Service Catalog" },
  },
  contact: {
    phone: "+201228004646",
    email: "info@egymac.net",
    address: {
      ar: "المقر الرئيسي: فيلا رقم 5 - شارع 291 - المعادي - القاهرة.\nالمصنع: منطقة أبو رواش الصناعية - الكيلو 26 - الجيزة",
      en: "Main Office: Villa No. 5 - Street 291 - Maadi - Cairo\nFactory: Abu Rawash Industrial Zone - Kilo 26 - Giza",
    },
    facebookUrl: "",
    website: "egymac.net",
  },
};

function normalizeFeatures(features = []) {
  const list = Array.isArray(features) ? features : [];
  return list.map((f, i) => ({
    id: Number(f.id) || i + 1,
    title: f.title ?? { ar: "", en: "" },
    description: f.description ?? { ar: "", en: "" },
    icon: f.icon || "Factory",
  }));
}

async function persistContentImages(content) {
  const next = structuredClone(content);

  if (next.hero?.backgroundImage) {
    next.hero.backgroundImage = await persistSiteImage("hero-bg", next.hero.backgroundImage);
  }
  if (next.about?.sectionImage) {
    next.about.sectionImage = await persistSiteImage("about-section", next.about.sectionImage);
  }

  return next;
}

/** GET /api/site-content — public */
router.get("/", async (_req, res) => {
  try {
    const content = await readJson(FILE, DEFAULT_SITE_CONTENT);
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/site-content — admin overwrite */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const current = await readJson(FILE, DEFAULT_SITE_CONTENT);

    const merged = {
      hero: { ...current.hero, ...(body.hero || {}) },
      about: { ...current.about, ...(body.about || {}) },
      features: normalizeFeatures(body.features ?? current.features),
      catalogTeaser: { ...current.catalogTeaser, ...(body.catalogTeaser || {}) },
      contact: { ...current.contact, ...(body.contact || {}) },
    };

    if (body.features) {
      merged.features = merged.features.map((f, i) => ({
        ...f,
        id: Number(f.id) || nextId(merged.features.slice(0, i)) || i + 1,
      }));
    }

    const persisted = await persistContentImages(merged);
    await writeJson(FILE, persisted);
    res.json({ success: true, data: persisted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  Loader2,
  Save,
  Plus,
  Trash2,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";
import { getSiteContent, updateSiteContent, getSiteTexts, updateSiteTexts } from "../../api/client.js";
import { fileToBase64 } from "../../utils/catalogImageUpload.js";
import { FEATURE_ICON_OPTIONS, resolveFeatureIcon } from "../../utils/siteContent.js";
import { PanelSkeleton } from "./Skeleton.jsx";
import "../../styles/siteContentAdmin.css";

const SECTIONS = [
  { id: "hero", label: "قسم الهيدر والترحيب — Hero Section" },
  { id: "about", label: "عن الشركة — About Section" },
  { id: "features", label: "المميزات والخدمات — Features Section" },
  { id: "catalog", label: "دعوة الفهرس — Catalog Teaser" },
  { id: "contact", label: "بيانات التواصل — Contact Info" },
];

const BILINGUAL_HERO = ["title", "subtitle", "badgeText", "ctaText"];
const BILINGUAL_ABOUT = ["heading", "description"];
const BILINGUAL_CATALOG = ["label", "heading", "ctaText"];

const LEGACY_TEXT_FIELDS = {
  hero: ["badge", "headline", "headlineAccent", "headlineEnd", "subtext", "ctaPrimary", "ctaSecondary"],
  about: ["subtitle", "title", "intro", "mission"],
};

function AccordionSection({ id, label, open, onToggle, children }) {
  return (
    <div className="site-content-accordion__item">
      <button
        type="button"
        className="site-content-accordion__trigger"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        onClick={onToggle}
      >
        <span>{label}</span>
        <ChevronDown size={18} className="site-content-accordion__chevron" aria-hidden />
      </button>
      {open ? (
        <div id={`panel-${id}`} className="site-content-accordion__panel">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function BilingualFields({ fields, section, draft, onChange, multiline = [] }) {
  return (
    <div className="site-content-lang-grid">
      {["ar", "en"].map((lang) => (
        <div key={lang} className="site-content-lang-panel">
          <p className="site-content-lang-panel__label">{lang === "ar" ? "العربية" : "English"}</p>
          {fields.map((field) => (
            <div key={field} className="site-content-field">
              <label className="site-content-field__label" htmlFor={`${section}-${field}-${lang}`}>
                {field}
              </label>
              {multiline.includes(field) ? (
                <textarea
                  id={`${section}-${field}-${lang}`}
                  className="site-content-field__textarea"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  value={draft?.[section]?.[field]?.[lang] ?? ""}
                  onChange={(e) => onChange(section, field, lang, e.target.value)}
                />
              ) : (
                <input
                  id={`${section}-${field}-${lang}`}
                  className="site-content-field__input"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  value={draft?.[section]?.[field]?.[lang] ?? ""}
                  onChange={(e) => onChange(section, field, lang, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ImagePicker({ label, value, onChange, onClear }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("الحد الأقصى 4 ميجابايت.");
      return;
    }
    try {
      const dataUri = await fileToBase64(file);
      onChange(dataUri);
    } catch (err) {
      setError(err.message);
    }
  };

  const previewSrc = value || null;

  return (
    <div className="site-content-field">
      <span className="site-content-field__label">{label}</span>
      <div className="site-content-image-picker">
        <div className="site-content-image-picker__preview">
          {previewSrc ? (
            <img src={previewSrc} alt="" />
          ) : (
            <span className="site-content-image-picker__placeholder">لا توجد صورة</span>
          )}
        </div>
        <div className="site-content-image-picker__actions">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            className="site-content-image-picker__btn"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={16} />
            اختيار صورة
          </button>
          {previewSrc ? (
            <button type="button" className="site-content-image-picker__btn site-content-image-picker__btn--danger" onClick={onClear}>
              <Trash2 size={14} />
              إزالة
            </button>
          ) : null}
          {error ? <p className="text-red-600 text-xs">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function SiteContentManagement({ adminKey }) {
  const [draft, setDraft] = useState(null);
  const [legacyTexts, setLegacyTexts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [openSection, setOpenSection] = useState("hero");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.allSettled([getSiteContent(), getSiteTexts()])
      .then(([contentResult, textsResult]) => {
        if (cancelled) return;
        if (contentResult.status === "fulfilled") {
          setDraft(structuredClone(contentResult.value.data));
        } else {
          setError(contentResult.reason?.message || "تعذّر تحميل المحتوى.");
        }
        if (textsResult.status === "fulfilled") {
          setLegacyTexts(textsResult.value.data ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateBilingual = useCallback((section, field, lang, value) => {
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: { ...prev[section][field], [lang]: value },
      },
    }));
  }, []);

  const updateScalar = useCallback((section, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }, []);

  const updateContact = useCallback((field, value) => {
    setDraft((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }, []);

  const updateContactAddress = useCallback((lang, value) => {
    setDraft((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        address: { ...prev.contact.address, [lang]: value },
      },
    }));
  }, []);

  const updateFeature = useCallback((index, patch) => {
    setDraft((prev) => {
      const features = [...(prev.features || [])];
      features[index] = { ...features[index], ...patch };
      return { ...prev, features };
    });
  }, []);

  const updateFeatureField = useCallback((index, field, lang, value) => {
    setDraft((prev) => {
      const features = [...(prev.features || [])];
      features[index] = {
        ...features[index],
        [field]: { ...features[index][field], [lang]: value },
      };
      return { ...prev, features };
    });
  }, []);

  const addFeature = useCallback(() => {
    setDraft((prev) => {
      const features = [...(prev.features || [])];
      const nextId = features.length ? Math.max(...features.map((f) => Number(f.id) || 0)) + 1 : 1;
      features.push({
        id: nextId,
        title: { ar: "", en: "" },
        description: { ar: "", en: "" },
        icon: "Factory",
      });
      return { ...prev, features };
    });
  }, []);

  const removeFeature = useCallback((index) => {
    setDraft((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  }, []);

  const updateLegacyText = useCallback((section, lang, key, value) => {
    setLegacyTexts((prev) => {
      if (!prev?.[section]?.[lang]) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [lang]: { ...prev[section][lang], [key]: value ?? "" },
        },
      };
    });
  }, []);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await updateSiteContent(draft, adminKey);
      setDraft(structuredClone(res.data));
      if (legacyTexts?.hero && legacyTexts?.about) {
        await updateSiteTexts({ hero: legacyTexts.hero, about: legacyTexts.about }, adminKey);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2800);
    } catch (e) {
      setError(e.message || "فشل حفظ المحتوى.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="site-content-admin">
        <PanelSkeleton rows={6} />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="site-content-alert site-content-alert--error" role="alert">
        {error || "لا يوجد محتوى للعرض."}
      </div>
    );
  }

  return (
    <div className="site-content-admin">
      <header className="site-content-admin__header">
        <h2 className="site-content-admin__title">إدارة محتوى الموقع / Website Content Manager</h2>
        <p className="site-content-admin__subtitle">
          تحكم موحّد في نصوص وصور الصفحة الرئيسية — Hero · About · Features · Contact · Legacy Copy
        </p>
      </header>

      {error ? (
        <div className="site-content-alert site-content-alert--error" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="site-content-alert site-content-alert--success flex items-center gap-2">
          <CheckCircle2 size={16} />
          تم حفظ المحتوى بنجاح
        </div>
      ) : null}

      <div className="site-content-accordion">
        <AccordionSection
          id="hero"
          label={SECTIONS[0].label}
          open={openSection === "hero"}
          onToggle={() => setOpenSection(openSection === "hero" ? "" : "hero")}
        >
          <BilingualFields
            section="hero"
            fields={BILINGUAL_HERO}
            draft={draft}
            onChange={updateBilingual}
            multiline={["subtitle"]}
          />
          <ImagePicker
            label="صورة خلفية الهيدر / Hero Background"
            value={draft.hero?.backgroundImage}
            onChange={(v) => updateScalar("hero", "backgroundImage", v)}
            onClear={() => updateScalar("hero", "backgroundImage", "")}
          />
        </AccordionSection>

        <AccordionSection
          id="about"
          label={SECTIONS[1].label}
          open={openSection === "about"}
          onToggle={() => setOpenSection(openSection === "about" ? "" : "about")}
        >
          <BilingualFields
            section="about"
            fields={BILINGUAL_ABOUT}
            draft={draft}
            onChange={updateBilingual}
            multiline={["description"]}
          />
          <ImagePicker
            label="صورة قسم عن الشركة / About Section Image"
            value={draft.about?.sectionImage}
            onChange={(v) => updateScalar("about", "sectionImage", v)}
            onClear={() => updateScalar("about", "sectionImage", "")}
          />
        </AccordionSection>

        <AccordionSection
          id="features"
          label={SECTIONS[2].label}
          open={openSection === "features"}
          onToggle={() => setOpenSection(openSection === "features" ? "" : "features")}
        >
          <div className="site-content-features">
            {(draft.features || []).map((feature, index) => {
              const IconPreview = resolveFeatureIcon(feature.icon);
              return (
                <div key={feature.id ?? index} className="site-content-feature-card">
                  <div className="site-content-feature-card__head">
                    <span className="site-content-feature-card__title">بطاقة #{index + 1}</span>
                    <button
                      type="button"
                      className="site-content-image-picker__btn site-content-image-picker__btn--danger"
                      onClick={() => removeFeature(index)}
                      aria-label="Remove feature"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="site-content-icon-select-row">
                    <div className="site-content-field" style={{ marginBottom: 0 }}>
                      <label className="site-content-field__label" htmlFor={`feature-icon-${index}`}>
                        icon
                      </label>
                      <select
                        id={`feature-icon-${index}`}
                        className="site-content-field__select"
                        value={feature.icon || "Factory"}
                        onChange={(e) => updateFeature(index, { icon: e.target.value })}
                      >
                        {FEATURE_ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="site-content-icon-preview" aria-hidden>
                      <IconPreview size={20} />
                    </div>
                  </div>
                  <BilingualFields
                    section={`features-${index}`}
                    fields={["title", "description"]}
                    draft={{
                      [`features-${index}`]: {
                        title: feature.title,
                        description: feature.description,
                      },
                    }}
                    onChange={(_section, field, lang, value) => updateFeatureField(index, field, lang, value)}
                    multiline={["description"]}
                  />
                </div>
              );
            })}
          </div>
          <button type="button" className="site-content-add-feature mt-4" onClick={addFeature}>
            <Plus size={16} />
            إضافة بطاقة ميزة
          </button>
        </AccordionSection>

        <AccordionSection
          id="catalog"
          label={SECTIONS[3].label}
          open={openSection === "catalog"}
          onToggle={() => setOpenSection(openSection === "catalog" ? "" : "catalog")}
        >
          <BilingualFields
            section="catalogTeaser"
            fields={BILINGUAL_CATALOG}
            draft={draft}
            onChange={(section, field, lang, value) => {
              setDraft((prev) => ({
                ...prev,
                catalogTeaser: {
                  ...prev.catalogTeaser,
                  [field]: { ...prev.catalogTeaser[field], [lang]: value },
                },
              }));
            }}
          />
        </AccordionSection>

        {legacyTexts ? (
          <AccordionSection
            id="legacy-copy"
            label="نصوص إضافية للصفحة الرئيسية — Legacy Homepage Copy"
            open={openSection === "legacy-copy"}
            onToggle={() => setOpenSection(openSection === "legacy-copy" ? "" : "legacy-copy")}
          >
            {["hero", "about"].map((section) => (
              <div key={section} className="mb-6 last:mb-0">
                <p className="text-xs font-bold text-[#3b767c] uppercase tracking-wide mb-3">{section}</p>
                <div className="site-content-lang-grid">
                  {["ar", "en"].map((lang) => (
                    <div key={lang} className="site-content-lang-panel">
                      <p className="site-content-lang-panel__label">{lang === "ar" ? "العربية" : "English"}</p>
                      {LEGACY_TEXT_FIELDS[section].map((field) => (
                        <div key={field} className="site-content-field">
                          <label className="site-content-field__label" htmlFor={`legacy-${section}-${field}-${lang}`}>
                            {field}
                          </label>
                          {["intro", "subtext", "mission"].includes(field) ? (
                            <textarea
                              id={`legacy-${section}-${field}-${lang}`}
                              className="site-content-field__textarea"
                              dir={lang === "ar" ? "rtl" : "ltr"}
                              rows={3}
                              value={legacyTexts[section]?.[lang]?.[field] ?? ""}
                              onChange={(e) => updateLegacyText(section, lang, field, e.target.value)}
                            />
                          ) : (
                            <input
                              id={`legacy-${section}-${field}-${lang}`}
                              className="site-content-field__input"
                              dir={lang === "ar" ? "rtl" : "ltr"}
                              value={legacyTexts[section]?.[lang]?.[field] ?? ""}
                              onChange={(e) => updateLegacyText(section, lang, field, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </AccordionSection>
        ) : null}

        <AccordionSection
          id="contact"
          label={SECTIONS[4].label}
          open={openSection === "contact"}
          onToggle={() => setOpenSection(openSection === "contact" ? "" : "contact")}
        >
          <div className="site-content-lang-grid">
            <div className="site-content-field">
              <label className="site-content-field__label" htmlFor="contact-phone">
                phone
              </label>
              <input
                id="contact-phone"
                className="site-content-field__input"
                dir="ltr"
                value={draft.contact?.phone ?? ""}
                onChange={(e) => updateContact("phone", e.target.value)}
              />
            </div>
            <div className="site-content-field">
              <label className="site-content-field__label" htmlFor="contact-email">
                email
              </label>
              <input
                id="contact-email"
                className="site-content-field__input"
                dir="ltr"
                type="email"
                value={draft.contact?.email ?? ""}
                onChange={(e) => updateContact("email", e.target.value)}
              />
            </div>
            <div className="site-content-field">
              <label className="site-content-field__label" htmlFor="contact-website">
                website
              </label>
              <input
                id="contact-website"
                className="site-content-field__input"
                dir="ltr"
                value={draft.contact?.website ?? ""}
                onChange={(e) => updateContact("website", e.target.value)}
              />
            </div>
            <div className="site-content-field">
              <label className="site-content-field__label" htmlFor="contact-facebook">
                facebookUrl
              </label>
              <input
                id="contact-facebook"
                className="site-content-field__input"
                dir="ltr"
                value={draft.contact?.facebookUrl ?? ""}
                onChange={(e) => updateContact("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>
          <div className="site-content-lang-grid mt-3">
            {["ar", "en"].map((lang) => (
              <div key={lang} className="site-content-lang-panel">
                <p className="site-content-lang-panel__label">address — {lang === "ar" ? "العربية" : "English"}</p>
                <textarea
                  className="site-content-field__textarea"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  rows={4}
                  value={draft.contact?.address?.[lang] ?? ""}
                  onChange={(e) => updateContactAddress(lang, e.target.value)}
                />
              </div>
            ))}
          </div>
        </AccordionSection>
      </div>

      <button
        type="button"
        className="site-content-floating-save"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        {saving ? "جاري الحفظ…" : "حفظ التغييرات / Save System Content"}
      </button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { getSiteTexts, updateSiteTexts } from "../../api/client.js";
import { PanelSkeleton } from "./Skeleton.jsx";

const FIELDS = {
  hero: ["badge", "headline", "headlineAccent", "headlineEnd", "subtext", "ctaPrimary", "ctaSecondary"],
  about: ["subtitle", "title", "intro", "mission"],
};

export default function TextManager({ adminKey }) {
  const [texts, setTexts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getSiteTexts()
      .then((r) => {
        if (!cancelled) setTexts(r.data ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load site texts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (section, lang, key, value) => {
    setTexts((prev) => {
      if (!prev?.[section]?.[lang]) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [lang]: { ...prev[section][lang], [key]: value ?? "" },
        },
      };
    });
  };

  const handleSave = async () => {
    if (!texts?.hero || !texts?.about) return;
    setStatus("loading");
    setError("");
    try {
      await updateSiteTexts({ hero: texts.hero, about: texts.about }, adminKey);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setStatus("error");
      setError(e.message || "Failed to save changes.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={4} />
      </div>
    );
  }

  if (error && !texts) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm" role="alert">
        {error}
      </div>
    );
  }

  if (!texts) {
    return <p className="text-ink-muted text-sm">No site text data available.</p>;
  }

  return (
    <div className="space-y-8">
      {["hero", "about"].map((section) => (
        <div key={section}>
          <h3 className="workspace-panel-title mb-4 border-b-0 pb-0">{section} Section</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            {["en", "ar"].map((lang) => (
              <div
                key={lang}
                className="space-y-3 p-5 rounded-2xl bg-surface-muted/60 border border-border/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
              >
                <p className="text-xs font-bold text-ink-muted uppercase">
                  {lang === "en" ? "English" : "Arabic"}
                </p>
                {FIELDS[section].map((field) => (
                  <div key={field}>
                    <label className="block text-[10px] font-semibold text-ink-muted uppercase mb-1">
                      {field}
                    </label>
                    {["intro", "subtext", "mission"].includes(field) ? (
                      <textarea
                        rows={3}
                        value={texts[section]?.[lang]?.[field] ?? ""}
                        onChange={(e) => update(section, lang, field, e.target.value)}
                        className="input-field resize-none"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                      />
                    ) : (
                      <input
                        value={texts[section]?.[lang]?.[field] ?? ""}
                        onChange={(e) => update(section, lang, field, e.target.value)}
                        className="input-field"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">
          {error}
        </p>
      )}
      {status === "success" && (
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle size={16} /> Saved successfully!
        </div>
      )}

      <button type="button" onClick={handleSave} disabled={status === "loading"} className="btn-primary">
        {status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        Save Changes
      </button>
    </div>
  );
}

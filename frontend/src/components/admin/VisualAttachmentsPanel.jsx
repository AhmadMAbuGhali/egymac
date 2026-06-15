import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { VISUAL_GALLERY_ITEMS, fileToDataUri } from "../../constants/visualOfferGallery.js";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Visual Offer Extension — editor panel (no-print). Manages local attachment
 * state only; never touches the standard quote fields.
 */
export default function VisualAttachmentsPanel({ attachments, onChange }) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");

  const addAttachment = (att) => onChange([...(Array.isArray(attachments) ? attachments : []), att]);

  const handleFiles = async (e) => {
    setUploadError("");
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setUploadError(`"${file.name}" exceeds 4 MB. Please use a smaller image.`);
        continue;
      }
      try {
        const src = await fileToDataUri(file);
        addAttachment({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          src,
          caption: file.name.replace(/\.[^.]+$/, ""),
          source: "upload",
        });
      } catch (err) {
        setUploadError(err.message);
      }
    }
  };

  const handleGalleryPick = (item) => {
    addAttachment({
      id: `gallery-${item.id}-${Date.now()}`,
      src: item.src,
      caption: item.labelAr,
      source: "gallery",
    });
  };

  const updateCaption = (id, caption) =>
    onChange((Array.isArray(attachments) ? attachments : []).map((a) => (a.id === id ? { ...a, caption: caption ?? "" } : a)));

  const removeAttachment = (id) =>
    onChange((Array.isArray(attachments) ? attachments : []).filter((a) => a.id !== id));

  return (
    <div className="space-y-4">
      {/* A) Upload from device */}
      <div>
        <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">Upload from Device</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-outline text-sm py-2 w-full border-dashed"
        >
          <Upload size={16} /> Attach Image(s) — converted locally to Base64
        </button>
        {uploadError && <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>}
      </div>

      {/* B) Gallery selection */}
      <div>
        <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">
          Gallery Selection — Pre-saved Mockups
        </p>
        <div className="grid grid-cols-2 gap-2">
          {VISUAL_GALLERY_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleGalleryPick(item)}
              title={item.labelEn}
              className="group border border-border hover:border-accent rounded-xl p-2 bg-surface-muted/70 hover:bg-accent-light hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.97] transition-all duration-200 text-start"
            >
              <img
                src={item.src}
                alt={item.labelEn}
                className="w-full h-16 object-contain rounded bg-white border border-border-light"
              />
              <span className="block mt-1.5 text-[11px] font-bold text-ink group-hover:text-accent" dir="rtl">
                {item.labelAr}
              </span>
              <span className="block text-[10px] text-ink-muted">{item.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Attached list */}
      {attachments.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">
            Attached ({attachments.length})
          </p>
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-border/70 bg-surface-muted/70 hover:border-accent/30 transition-colors duration-200"
              >
                <img
                  src={att.src}
                  alt={att.caption || "attachment"}
                  className="w-14 h-10 object-contain rounded bg-white border border-border-light shrink-0"
                />
                <input
                  value={att.caption || ""}
                  onChange={(e) => updateCaption(att.id, e.target.value)}
                  placeholder="وصف الصورة…"
                  className="input-field py-1.5 text-xs flex-1"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  title="Remove attachment"
                  className="row-action-btn row-action-btn--danger shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.length === 0 && (
        <p className="text-xs text-ink-muted flex items-center gap-1.5">
          <ImagePlus size={14} /> No attachments yet — upload or pick from the gallery above.
        </p>
      )}
    </div>
  );
}

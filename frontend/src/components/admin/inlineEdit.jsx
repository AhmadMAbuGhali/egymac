import { createContext, useContext } from "react";
import {
  MixedBidiText,
  BilingualSectionTitle,
  OfferTableCell,
  OfferTableHeader,
  isMostlyLatin,
} from "../../utils/offerBidi.jsx";
import { BRAND_PRIMARY } from "../../constants/offerPrintStyles.js";
import { sanitizeEditText, sanitizeNumericDisplay } from "../../utils/sanitizeEditText.js";
import "../../styles/inlineEdit.css";

/**
 * Universal inline editing for quote previews.
 * Components fall back to the original read-only renderers when no edit
 * context is provided, so every existing layout stays pixel-identical.
 * Edits commit on blur (uncontrolled while typing — caret never jumps),
 * Enter commits inline fields, Escape reverts.
 */

export const QuoteEditContext = createContext(null);

export function QuoteEditProvider({ onEdit, children }) {
  return <QuoteEditContext.Provider value={onEdit}>{children}</QuoteEditContext.Provider>;
}

function normalizeEdited(value, { block = false, numeric = false } = {}) {
  if (numeric) return sanitizeNumericDisplay(value);
  return sanitizeEditText(value, { block });
}

export function EditableText({
  path,
  text,
  fallback = "—",
  block = false,
  dirHint = "auto",
  className = "",
}) {
  const onEdit = useContext(QuoteEditContext);
  if (!onEdit) return <MixedBidiText text={text} fallback={fallback} />;

  const Tag = block ? "div" : "span";
  return (
    <Tag
      className={`qe-editable ${block ? "qe-block" : ""} ${className}`.trim()}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      dir={dirHint}
      style={dirHint === "auto" ? { unicodeBidi: "plaintext" } : undefined}
      data-qe-placeholder={fallback}
      onBlur={(e) => onEdit(path, normalizeEdited(block ? e.currentTarget.innerText : e.currentTarget.textContent, { block }))}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
      onKeyDown={(e) => {
        if (!block && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.textContent = text || "";
          e.currentTarget.blur();
        }
      }}
    >
      {text || ""}
    </Tag>
  );
}

/** Editable mirror of OfferTableCell — identical markup & classes */
export function EditableTableCell({ path, text, column, fallback = "—" }) {
  const onEdit = useContext(QuoteEditContext);
  if (!onEdit) return <OfferTableCell text={text} column={column} fallback={fallback} />;

  const colClass =
    column === "serial" ? "offer-col-serial" : column === "item" ? "offer-col-item" : "offer-col-desc";
  const alignClass =
    column === "serial" ? "offer-align-center" : isMostlyLatin(text) ? "offer-align-en" : "offer-align-ar";

  return (
    <td className={`${colClass} ${alignClass}${column === "serial" ? "" : " offer-td-ar"}`}>
      <EditableText
        path={path}
        text={text}
        fallback={fallback}
        dirHint={column === "serial" ? "ltr" : "auto"}
      />
    </td>
  );
}

/** Editable mirror of OfferTableHeader — identical markup & brand styling */
export function EditableTableHeader({ path, label, column }) {
  const onEdit = useContext(QuoteEditContext);
  if (!onEdit) return <OfferTableHeader label={label} column={column} />;

  const colClass =
    column === "serial"
      ? "offer-col-serial offer-th-serial"
      : column === "item"
        ? "offer-col-item offer-th-item"
        : "offer-col-desc offer-th-desc";
  const alignClass =
    column === "serial" ? "offer-align-center" : isMostlyLatin(label) ? "offer-align-en" : "offer-align-ar";

  return (
    <th
      className={`brand-bg ${colClass} ${alignClass}`}
      style={{
        backgroundColor: BRAND_PRIMARY,
        color: "#ffffff",
        fontFamily: "Cairo, sans-serif",
        borderColor: "#2e6569",
      }}
    >
      <EditableText path={path} text={label} fallback="—" />
    </th>
  );
}

/** Editable mirror of BilingualSectionTitle — each half edits independently */
export function EditableSectionTitle({ path, title, fallbackAr, fallbackEn }) {
  const onEdit = useContext(QuoteEditContext);
  if (!onEdit) return <BilingualSectionTitle title={title} fallbackAr={fallbackAr} fallbackEn={fallbackEn} />;

  const raw = title || `${fallbackAr} / ${fallbackEn}`;
  const hasSplit = raw.includes("/");
  const [arPart, ...rest] = hasSplit ? raw.split("/") : [raw];
  const enPart = hasSplit ? rest.join("/").trim() : "";

  const commit = (nextAr, nextEn) => {
    const ar = normalizeEdited(nextAr) || fallbackAr;
    const en = normalizeEdited(nextEn);
    onEdit(path, en ? `${ar} / ${en}` : ar);
  };

  const titleStyle = {
    borderBottom: `2px solid ${BRAND_PRIMARY}`,
    color: BRAND_PRIMARY,
    fontFamily: "Cairo, sans-serif",
  };

  return (
    <h2 className="offer-section-title" style={titleStyle}>
      <span
        dir="rtl"
        className="offer-align-ar offer-section-ar qe-editable"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => commit(e.currentTarget.textContent, enPart)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
      >
        {arPart.trim()}
      </span>
      <span
        dir="ltr"
        className="offer-align-en offer-section-en qe-editable"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => commit(arPart, e.currentTarget.textContent)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
      >
        {enPart || fallbackEn}
      </span>
    </h2>
  );
}

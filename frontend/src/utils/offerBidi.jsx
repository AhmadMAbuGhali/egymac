/** Bidi-safe text helpers — Arabic shaped by browser, captured via html2canvas */

import { BRAND_PRIMARY, BRAND_PRIMARY_DARK } from "../constants/offerPrintStyles.js";

const LTR_CHUNK_RE =
  /(\+[0-9][0-9\s\-]*|[0-9]+(?:[.,][0-9]+)?%?|[0-9]+(?:\s*[×xX]\s*[0-9]+)+|[A-Za-z][A-Za-z0-9\s\-./\\]*)/g;

/** True when Latin/digit characters dominate (English technical values) */
export function isMostlyLatin(text) {
  if (!text?.trim()) return false;
  const latin = (text.match(/[A-Za-z0-9×xX]/g) || []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return latin > arabic;
}

function isLtrChunk(part) {
  return /^(\+?\d|[A-Za-z]|[0-9]+\s*[×xX])/.test(String(part).trim());
}

/**
 * Mixed Arabic/Latin — LTR tokens in <span dir="ltr" class="inline-block">,
 * Arabic in isolated RTL spans for connected shaping.
 */
export function MixedBidiText({ text, fallback = "—" }) {
  if (!text?.trim()) {
    return (
      <span dir="rtl" className="offer-align-ar">
        {fallback}
      </span>
    );
  }

  const parts = text.split(LTR_CHUNK_RE).filter((p) => p !== "");
  const hasMixed = parts.some(isLtrChunk) && parts.some((p) => !isLtrChunk(p));

  if (!hasMixed) {
    if (isMostlyLatin(text)) {
      return (
        <span dir="ltr" className="inline-block offer-ltr-isolate offer-align-en">
          {text}
        </span>
      );
    }
    return (
      <span dir="rtl" className="offer-align-ar">
        {text}
      </span>
    );
  }

  return (
    <span className="offer-mixed-line" dir="rtl">
      {parts.map((part, i) =>
        isLtrChunk(part) ? (
          <span key={i} dir="ltr" className="inline-block offer-ltr-isolate">
            {part}
          </span>
        ) : (
          <span key={i} dir="rtl" className="offer-ar-chunk">
            {part}
          </span>
        )
      )}
    </span>
  );
}

/** Split "Arabic / English" section headings */
export function BilingualSectionTitle({ title, fallbackAr, fallbackEn }) {
  const raw = title || `${fallbackAr} / ${fallbackEn}`;
  if (raw.includes("/")) {
    const [arPart, ...rest] = raw.split("/");
    const enPart = rest.join("/").trim();
    return (
      <h2
        className="offer-section-title"
        style={{
          borderBottom: `2px solid ${BRAND_PRIMARY}`,
          color: BRAND_PRIMARY,
          fontFamily: "Cairo, sans-serif",
        }}
      >
        <span dir="rtl" className="offer-align-ar offer-section-ar">
          {arPart.trim()}
        </span>
        <span dir="ltr" className="offer-align-en offer-section-en">
          {enPart || fallbackEn}
        </span>
      </h2>
    );
  }

  return (
    <h2
      className="offer-section-title"
      style={{
        borderBottom: `2px solid ${BRAND_PRIMARY}`,
        color: BRAND_PRIMARY,
        fontFamily: "Cairo, sans-serif",
      }}
    >
      {isMostlyLatin(raw) ? (
        <span dir="ltr" className="offer-align-en">
          {raw}
        </span>
      ) : (
        <span dir="rtl" className="offer-align-ar">
          {raw}
        </span>
      )}
    </h2>
  );
}

/** Table cell — table stays LTR; cell content uses native bidi */
export function OfferTableCell({ text, column, fallback = "—" }) {
  const colClass =
    column === "serial"
      ? "offer-col-serial"
      : column === "item"
        ? "offer-col-item"
        : "offer-col-desc";

  const alignClass =
    column === "serial"
      ? "offer-align-center"
      : isMostlyLatin(text)
        ? "offer-align-en"
        : "offer-align-ar";

  if (column === "serial") {
    return (
      <td className={`${colClass} ${alignClass}`}>
        <span dir="ltr" className="inline-block offer-ltr-isolate">
          {text || fallback}
        </span>
      </td>
    );
  }

  return (
    <td className={`${colClass} ${alignClass} offer-td-ar`}>
      <MixedBidiText text={text} fallback={fallback} />
    </td>
  );
}

/** Table header cell */
export function OfferTableHeader({ label, column }) {
  const colClass =
    column === "serial"
      ? "offer-col-serial offer-th-serial"
      : column === "item"
        ? "offer-col-item offer-th-item"
        : "offer-col-desc offer-th-desc";

  const alignClass =
    column === "serial"
      ? "offer-align-center"
      : isMostlyLatin(label)
        ? "offer-align-en"
        : "offer-align-ar";

  return (
    <th
      className={`brand-bg ${colClass} ${alignClass}`}
      style={{
        backgroundColor: "#3b767c",
        color: "#ffffff",
        fontFamily: "Cairo, sans-serif",
        borderColor: "#2e6569",
      }}
    >
      <MixedBidiText text={label} fallback="—" />
    </th>
  );
}

/**
 * Stabilize layout + bidi on cloned/live DOM immediately before html2canvas.
 * Arabic MUST keep direction:rtl for connected letter shaping.
 */
export function preparePdfCaptureLayout(root) {
  if (!root) return;

  root.setAttribute("dir", "ltr");
  root.style.direction = "ltr";

  root.querySelectorAll(".offer-table-premium").forEach((table) => {
    table.setAttribute("dir", "ltr");
    table.style.direction = "ltr";
    table.style.tableLayout = "fixed";
    table.style.width = "100%";
  });

  root.querySelectorAll(".offer-align-ar, .offer-ar-chunk, bdi[dir='rtl']").forEach((el) => {
    el.style.direction = "rtl";
    el.style.textAlign = "right";
    el.style.unicodeBidi = "isolate";
  });

  root.querySelectorAll(".offer-align-en, .offer-ltr-isolate, bdi[dir='ltr']").forEach((el) => {
    el.style.direction = "ltr";
    el.style.textAlign = "left";
    el.style.unicodeBidi = "isolate";
  });

  root.querySelectorAll(".offer-align-center").forEach((el) => {
    el.style.direction = "ltr";
    el.style.textAlign = "center";
    el.style.unicodeBidi = "isolate";
  });

  [[".offer-col-desc, .offer-th-desc", "45%"], [".offer-col-item, .offer-th-item", "45%"], [".offer-col-serial, .offer-th-serial", "10%"]].forEach(
    ([selector, width]) => {
      root.querySelectorAll(selector).forEach((el) => {
        el.style.width = width;
      });
    }
  );
}

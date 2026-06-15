import { buildFreeFormQuoteHtml } from "./freeFormQuoteHtml.js";
import { buildReplicaQuoteHtml } from "./replicaQuoteHtml.js";
import { buildMachineryQuoteHtml } from "./machineryQuoteHtml.js";
import { withPdfPage, closePdfBrowser, PDF_TIMEOUT_MS } from "./pdfBrowserPool.js";
import { getFontLoadWaitMs, usesLocalCairoFonts } from "./printFonts.js";

const MARGINS = {
  compact: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  spanned: { top: "15mm", right: "10mm", bottom: "15mm", left: "10mm" },
};

async function waitForFonts(page) {
  const timeoutMs = getFontLoadWaitMs();
  const requireLocal = usesLocalCairoFonts();

  await page.evaluate(
    async ({ timeoutMs, requireLocal }) => {
      const deadline = Date.now() + timeoutMs;
      const checkCairo = () => {
        try {
          return document.fonts.check('16px "Cairo"') || document.fonts.check("16px Cairo");
        } catch {
          return false;
        }
      };

      while (Date.now() < deadline) {
        await document.fonts.ready;
        if (checkCairo()) return;
        await new Promise((r) => setTimeout(r, 120));
      }

      if (requireLocal && !checkCairo()) {
        console.warn("[PDF] Cairo font not confirmed before timeout; proceeding with fallback stack.");
      }
    },
    { timeoutMs, requireLocal }
  );
}

function forcePreviewBrandColors(page) {
  return page.evaluate(() => {
    const brand = "#3b767c";
    const brandDark = "#2e6569";
    const brandLight = "#e9f3f4";

    document
      .querySelectorAll(
        ".offer-sheet-accent, .brand-bg, .offer-table-premium th, .offer-table-premium thead tr, .offer-footer-rule"
      )
      .forEach((el) => {
        el.style.setProperty("background-color", brand, "important");
        el.style.setProperty("-webkit-print-color-adjust", "exact");
        el.style.setProperty("print-color-adjust", "exact");
      });

    document.querySelectorAll(".offer-table-premium th").forEach((el) => {
      el.style.setProperty("color", "#ffffff", "important");
      el.style.setProperty("border-color", brandDark, "important");
    });

    document.querySelectorAll(".offer-section-title").forEach((el) => {
      el.style.setProperty("border-bottom-color", brand, "important");
    });

    document.querySelectorAll(".offer-meta-title, .offer-footer-phone").forEach((el) => {
      el.style.setProperty("color", brand, "important");
    });

    document.querySelectorAll(".offer-meta-block").forEach((el) => {
      el.style.setProperty("border-color", brand, "important");
      el.style.setProperty("background-color", brandLight, "important");
    });

    document.querySelectorAll(".offer-document-footer").forEach((el) => {
      el.style.setProperty("border-top-color", brand, "important");
      el.style.setProperty("background-color", brandLight, "important");
    });

    const isCompact = document.getElementById("quotation-print-area")?.classList.contains("print-mode-compact");
    const logoHeight = isCompact ? "6.5rem" : "8.5rem";
    const logoMax = isCompact ? "16rem" : "22rem";
    document.querySelectorAll(".offer-sheet-logo").forEach((el) => {
      el.style.setProperty("height", logoHeight, "important");
      el.style.setProperty("width", "auto", "important");
      el.style.setProperty("max-width", logoMax, "important");
      el.style.setProperty("object-fit", "contain", "important");
    });

    document.querySelectorAll(".offer-sheet-brand, .offer-sheet-brand-text").forEach((el) => {
      el.style.setProperty("text-align", "center", "important");
      el.style.setProperty("align-items", "center", "important");
      el.style.setProperty("width", "100%", "important");
    });

    document.querySelectorAll(".offer-sheet-company, .offer-sheet-tagline").forEach((el) => {
      el.style.setProperty("text-align", "center", "important");
      el.style.setProperty("width", "100%", "important");
    });

    document.querySelectorAll(".offer-sheet-tagline").forEach((el) => {
      el.style.setProperty("display", "flex", "important");
      el.style.setProperty("justify-content", "center", "important");
      el.style.setProperty("flex-wrap", "wrap", "important");
      el.style.setProperty("align-items", "center", "important");
    });
  });
}

/**
 * Generate PDF via Puppeteer — bounded concurrency, page always closed in pool.
 */
export async function generateFreeFormQuotePdf(quote, printMode = "spanned") {
  const mode = printMode === "compact" ? "compact" : "spanned";
  const html =
    quote.templateStyle === "machinery_detailed"
      ? buildMachineryQuoteHtml(quote, mode)
      : quote.templateStyle === "replica"
        ? buildReplicaQuoteHtml(quote, mode)
        : buildFreeFormQuoteHtml(quote, mode);

  return withPdfPage(async (page) => {
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "load", timeout: PDF_TIMEOUT_MS });
    await waitForFonts(page);
    await forcePreviewBrandColors(page);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: MARGINS[mode],
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 1,
    });

    return Buffer.from(pdf);
  });
}

export { closePdfBrowser };

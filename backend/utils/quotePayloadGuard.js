/** Estimate and guard quote JSON payloads before PDF / save operations */

function getMaxBytes() {
  return Number(process.env.QUOTE_PAYLOAD_MAX_BYTES) || 48 * 1024 * 1024;
}

function collectBase64Strings(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string") {
    if (value.startsWith("data:image/") || value.length > 50_000) out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectBase64Strings(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value)) collectBase64Strings(v, out);
  }
  return out;
}

export function estimatePayloadBytes(payload) {
  try {
    return Buffer.byteLength(JSON.stringify(payload ?? {}), "utf8");
  } catch {
    return Infinity;
  }
}

export function analyzeQuotePayload(quote) {
  const totalBytes = estimatePayloadBytes(quote);
  const embeddedImages = collectBase64Strings(quote);
  const embeddedImageBytes = embeddedImages.reduce((sum, s) => sum + Buffer.byteLength(s, "utf8"), 0);

  return {
    totalBytes,
    embeddedImageCount: embeddedImages.length,
    embeddedImageBytes,
    exceedsLimit: totalBytes > getMaxBytes(),
    maxBytes: getMaxBytes(),
  };
}

export function assertQuotePayloadWithinLimit(quote) {
  const analysis = analyzeQuotePayload(quote);
  if (analysis.exceedsLimit) {
    const mb = (analysis.totalBytes / (1024 * 1024)).toFixed(1);
    const maxMb = (analysis.maxBytes / (1024 * 1024)).toFixed(0);
    const err = new Error(
      `Quote payload too large (${mb} MB, limit ${maxMb} MB). ` +
        `${analysis.embeddedImageCount} embedded image(s) account for ~${(analysis.embeddedImageBytes / (1024 * 1024)).toFixed(1)} MB. ` +
        "Reduce image count/size or save without embedding full-resolution photos in the PDF request."
    );
    err.statusCode = 413;
    throw err;
  }
  return analysis;
}

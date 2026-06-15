import { describe, it, expect } from "vitest";
import {
  estimatePayloadBytes,
  analyzeQuotePayload,
} from "../utils/quotePayloadGuard.js";

describe("quotePayloadGuard (static analysis)", () => {
  it("estimatePayloadBytes returns byte length of JSON", () => {
    const bytes = estimatePayloadBytes({ hello: "world" });
    expect(bytes).toBe(Buffer.byteLength(JSON.stringify({ hello: "world" }), "utf8"));
  });

  it("analyzeQuotePayload detects embedded base64 images", () => {
    const tiny = "data:image/png;base64,abcd";
    const analysis = analyzeQuotePayload({ visualAttachments: [{ src: tiny }] });
    expect(analysis.embeddedImageCount).toBeGreaterThanOrEqual(1);
  });
});

describe("quotePayloadGuard (limit enforcement)", () => {
  it("throws statusCode 413 when payload exceeds configured limit", async () => {
    process.env.QUOTE_PAYLOAD_MAX_BYTES = "1024";
    const { assertQuotePayloadWithinLimit } = await import("../utils/quotePayloadGuard.js");

    try {
      assertQuotePayloadWithinLimit({ blob: "x".repeat(2048) });
      expect.fail("Expected 413 error");
    } catch (err) {
      expect(err.statusCode).toBe(413);
      expect(err.message).toMatch(/too large/i);
    }
  });

  it("allows small valid payloads", async () => {
    process.env.QUOTE_PAYLOAD_MAX_BYTES = "1024";
    const { assertQuotePayloadWithinLimit } = await import("../utils/quotePayloadGuard.js");

    const analysis = assertQuotePayloadWithinLimit({
      clientName: "Test",
      commercialTerms: [{ termKey: "Price", termValue: "1000" }],
    });
    expect(analysis.exceedsLimit).toBe(false);
  });
});

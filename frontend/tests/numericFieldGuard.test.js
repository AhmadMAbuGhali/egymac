import { describe, it, expect } from "vitest";
import {
  sanitizePriceInput,
  sanitizeQuantityInput,
  sanitizeDimensionInput,
  parsePriceNumber,
} from "../src/utils/numericFieldGuard.js";

describe("numericFieldGuard", () => {
  it("sanitizePriceInput rejects scientific notation and negatives", () => {
    expect(sanitizePriceInput("1e10")).toBe("");
    expect(sanitizePriceInput("-500")).toBe("");
    expect(sanitizePriceInput("900,000")).toBe("900,000");
  });

  it("sanitizeQuantityInput returns non-negative integers only", () => {
    expect(sanitizeQuantityInput("-3")).toBe("");
    expect(sanitizeQuantityInput("42")).toBe("42");
    expect(sanitizeQuantityInput("abc")).toBe("");
  });

  it("sanitizeDimensionInput allows bilingual dimension text", () => {
    expect(sanitizeDimensionInput("39 × 19 × 11.5 سم")).toContain("39");
    expect(sanitizeDimensionInput("<script>")).toBe("");
  });

  it("parsePriceNumber parses sanitized currency strings", () => {
    expect(parsePriceNumber("135,000")).toBe(135000);
    expect(parsePriceNumber("invalid")).toBeNull();
  });
});

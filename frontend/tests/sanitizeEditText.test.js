import { describe, it, expect } from "vitest";
import { stripHtml, sanitizeEditText, sanitizeNumericDisplay } from "../src/utils/sanitizeEditText.js";

describe("sanitizeEditText", () => {
  it("strips script tags and leaves harmless text", () => {
    const malicious = '<script>alert(1)</script>Hello';
    expect(sanitizeEditText(malicious)).toBe("Hello");
    expect(stripHtml("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("strips img onerror XSS vectors", () => {
    const xss = '<img src=x onerror=alert(1)>Safe text';
    expect(sanitizeEditText(xss)).toBe("Safe text");
  });

  it("strips nested HTML and decodes common entities", () => {
    expect(sanitizeEditText("<b>Bold</b> &amp; <i>Italic</i>")).toBe("Bold & Italic");
  });

  it("removes control characters and zero-width spaces", () => {
    expect(sanitizeEditText("Hello\u0007World\u200B")).toBe("HelloWorld");
  });

  it("collapses newlines in inline mode", () => {
    expect(sanitizeEditText("Line1\nLine2", { block: false })).toBe("Line1 Line2");
  });

  it("preserves intentional line breaks in block mode", () => {
    expect(sanitizeEditText("Line1\nLine2", { block: true })).toBe("Line1\nLine2");
  });

  it("enforces maxLength truncation", () => {
    expect(sanitizeEditText("abcdefghij", { maxLength: 5 })).toBe("abcde");
  });

  it("sanitizeNumericDisplay strips injection characters from price fields", () => {
    expect(sanitizeNumericDisplay("1,500<script>")).toBe("1,500");
    expect(sanitizeNumericDisplay("-999")).toBe("999");
  });
});

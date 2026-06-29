import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { publicErrorMessage } from "../utils/safeError.js";

describe("publicErrorMessage", () => {
  const prev = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = prev;
  });

  it("returns internal message in development", () => {
    process.env.NODE_ENV = "development";
    expect(publicErrorMessage(new Error("db timeout"))).toBe("db timeout");
  });

  it("hides internal message in production", () => {
    process.env.NODE_ENV = "production";
    expect(publicErrorMessage(new Error("db timeout"))).toMatch(/unexpected error/i);
  });

  it("allows exposed client errors in production", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Invalid payload");
    err.expose = true;
    expect(publicErrorMessage(err)).toBe("Invalid payload");
  });
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    testTimeout: 120_000,
    hookTimeout: 30_000,
    pool: "forks",
  },
});

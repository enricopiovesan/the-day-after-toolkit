import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["test-fixtures/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"]
    }
  }
});

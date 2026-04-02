import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseRoadmapReport } from "./parser.js";

describe("parseRoadmapReport", () => {
  it("parses the example report into roadmap-ready capability inputs", async () => {
    const reportPath = fileURLToPath(new URL("../../../docs/example-cdad-report.md", import.meta.url));
    const markdown = await readFile(reportPath, "utf8");
    const report = parseRoadmapReport(markdown, reportPath);

    expect(report.reportPath).toBe(reportPath);
    expect(report.generatedAt).toBe("2026-04-01T00:00:00.000Z");
    expect(report.reportScore).toBe(3.4);
    expect(report.summary).toContain("This repository already has a meaningful amount of structure");
    expect(report.capabilities).toHaveLength(1);
    expect(report.capabilities[0]?.capability).toBe("payment/retry");
    expect(report.capabilities[0]?.legibilityScore).toBe(1);
    expect(report.capabilities[0]?.primaryGaps).toEqual(["constraint history", "dependency rationale"]);
  });
});

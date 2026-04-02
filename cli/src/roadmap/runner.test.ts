import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { runRoadmapCommand } from "./runner.js";

describe("runRoadmapCommand", () => {
  it("reads a report and writes a roadmap markdown file", async () => {
    const workingDir = await mkdtemp(join(tmpdir(), "cdad-roadmap-"));
    const reportPath = join(workingDir, "cdad-report.md");
    const outputPath = join(workingDir, "cdad-roadmap.md");
    const markdown = await readFile(
      fileURLToPath(new URL("../../../docs/example-cdad-report.md", import.meta.url)),
      "utf8"
    );

    await writeFile(reportPath, markdown, "utf8");

    const result = await runRoadmapCommand(
      {
        inputPath: workingDir,
        outputPath: workingDir,
        format: "markdown"
      },
      {
        prompt: vi.fn(async () => ({
          businessCriticality: 3,
          agentTouchpointFrequency: 1
        })),
        now: () => new Date("2026-04-02T00:00:00Z")
      }
    );

    const written = await readFile(outputPath, "utf8");

    expect(result.inputPath).toBe(reportPath);
    expect(result.outputPath).toBe(outputPath);
    expect(result.terminal).toContain("cdad roadmap — Transformation Roadmap");
    expect(result.terminal).toContain("Prioritization complete. 1 capabilities ranked.");
    expect(result.terminal).toContain("Priority order:");
    expect(result.terminal).toContain("payment/retry");
    expect(result.terminal).toContain(`Roadmap saved to: ${outputPath}`);
    expect(written).toContain("generated_by: cdad roadmap");
    expect(written).toContain("generated_at: 2026-04-02T00:00:00.000Z");
    expect(written).toContain("## Phase 1 — Immediate (Weeks 1–4)");
    expect(written).toContain("payment/retry");
    expect(written).toContain("| payment/retry | 3 | 3 | 1 | 9 | 1 |");
  });
});

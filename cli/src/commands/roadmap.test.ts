import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { executeRoadmapCommand } from "./roadmap.js";

describe("executeRoadmapCommand", () => {
  it("writes a markdown roadmap and returns the terminal summary", async () => {
    const workingDir = await mkdtemp(join(tmpdir(), "cdad-roadmap-command-"));
    const reportPath = join(workingDir, "cdad-report.md");
    const outputPath = join(workingDir, "cdad-roadmap.md");
    const markdown = await readFile(
      fileURLToPath(new URL("../../../docs/example-cdad-report.md", import.meta.url)),
      "utf8"
    );

    await writeFile(reportPath, markdown, "utf8");

    const execution = await executeRoadmapCommand(
      {
        input: reportPath,
        output: outputPath,
        format: "markdown"
      },
      {
        prompt: vi.fn(async () => ({
          businessCriticality: 3 as const,
          agentTouchpointFrequency: 1 as const
        })),
        now: () => new Date("2026-04-08T00:00:00Z")
      }
    );

    const written = await readFile(outputPath, "utf8");

    expect(execution.output).toContain("cdad roadmap — Transformation Roadmap");
    expect(execution.output).toContain(`Roadmap saved to: ${outputPath}`);
    expect(execution.result.outputPath).toBe(outputPath);
    expect(written).toContain("generated_by: cdad roadmap");
    expect(written).toContain("generated_at: 2026-04-08T00:00:00.000Z");
  });

  it("writes json output and normalizes the basename when the output path uses markdown naming", async () => {
    const workingDir = await mkdtemp(join(tmpdir(), "cdad-roadmap-command-json-"));
    const reportPath = join(workingDir, "cdad-report.md");
    const requestedOutputPath = join(workingDir, "cdad-roadmap.md");
    const markdown = await readFile(
      fileURLToPath(new URL("../../../docs/example-cdad-report.md", import.meta.url)),
      "utf8"
    );

    await writeFile(reportPath, markdown, "utf8");

    const execution = await executeRoadmapCommand(
      {
        input: reportPath,
        output: requestedOutputPath,
        format: "json"
      },
      {
        prompt: vi.fn(async () => ({
          businessCriticality: 2 as const,
          agentTouchpointFrequency: 2 as const
        })),
        now: () => new Date("2026-04-08T00:00:00Z")
      }
    );

    const jsonOutputPath = join(workingDir, "cdad-roadmap.json");
    const written = JSON.parse(await readFile(jsonOutputPath, "utf8")) as Record<string, unknown>;

    expect(execution.result.outputPath).toBe(jsonOutputPath);
    expect(written.generatedBy).toBe("cdad roadmap");
    expect(Array.isArray(written.capabilities)).toBe(true);
  });
});

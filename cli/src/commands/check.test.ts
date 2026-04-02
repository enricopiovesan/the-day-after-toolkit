import { access, mkdtemp, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { executeCheckCommand } from "./check.js";

describe("executeCheckCommand", () => {
  it("writes a report from prompted capability answers", async () => {
    const workingDir = await mkdtemp(join(tmpdir(), "cdad-check-"));
    const outputPath = join(workingDir, "cdad-report.md");
    const prompt = createPromptQueue([
      { capabilityNames: "payment/retry, auth/session/login" },
      {
        "payment/retry.businessRules": "no",
        "payment/retry.constraintHistory": "no",
        "payment/retry.dependencyRationale": "partially",
        "payment/retry.exceptionLogic": "yes"
      },
      {
        "auth/session/login.businessRules": "yes",
        "auth/session/login.constraintHistory": "partially",
        "auth/session/login.dependencyRationale": "yes",
        "auth/session/login.exceptionLogic": "no"
      }
    ]);

    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await executeCheckCommand(
      {
        output: outputPath,
        capabilities: "2",
        skipScan: true,
        format: "markdown"
      },
      {
        cwd: workingDir,
        now: () => new Date("2026-04-02T00:00:00Z"),
        prompt
      }
    );

    const written = await readFile(outputPath, "utf8");

    expect(result.outputPath).toBe(outputPath);
    expect(result.summary).toContain("Questionnaire: 2 capabilities assessed");
    expect(result.summary).toContain("Full report saved to:");
    expect(written).toContain("generated_by: cdad check");
    expect(written).toContain("generated_at: 2026-04-02T00:00:00.000Z");
    expect(written).toContain("### payment/retry");
    expect(written).toContain("### auth/session/login");
    expect(log).toHaveBeenCalledTimes(1);

    log.mockRestore();
  });

  it("supports quiet mode without writing the full report", async () => {
    const workingDir = await mkdtemp(join(tmpdir(), "cdad-check-quiet-"));
    const outputPath = join(workingDir, "cdad-report.md");
    const prompt = createPromptQueue([
      { capabilityNames: "payment/retry" },
      {
        "payment/retry.businessRules": "yes",
        "payment/retry.constraintHistory": "yes",
        "payment/retry.dependencyRationale": "yes",
        "payment/retry.exceptionLogic": "yes"
      }
    ]);

    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await executeCheckCommand(
      {
        output: outputPath,
        capabilities: "1",
        skipScan: true,
        format: "markdown",
        quiet: true
      },
      {
        cwd: workingDir,
        now: () => new Date("2026-04-02T00:00:00Z"),
        prompt
      }
    );

    await expect(access(outputPath, fsConstants.F_OK)).rejects.toThrow();
    expect(result.outputPath).toBeNull();
    expect(result.summary).not.toContain("Full report saved to:");

    log.mockRestore();
  });

  it("rejects capability limits outside the allowed range", async () => {
    const workingDir = await mkdtemp(join(tmpdir(), "cdad-check-range-"));

    await expect(
      executeCheckCommand(
        {
          output: join(workingDir, "cdad-report.md"),
          capabilities: "11",
          skipScan: true,
          skipQuestions: true,
          format: "markdown"
        },
        {
          cwd: workingDir,
          now: () => new Date("2026-04-02T00:00:00Z"),
          prompt: vi.fn()
        }
      )
    ).rejects.toThrow("--capabilities must be an integer between 1 and 10");
  });
});

function createPromptQueue(
  responses: readonly Record<string, unknown>[]
) {
  const queue = [...responses];

  return async <TAnswer extends Record<string, unknown>>(
    incomingQuestions?: readonly unknown[]
  ): Promise<TAnswer> => {
    void incomingQuestions;
    const next = queue.shift();

    if (!next) {
      throw new Error("Prompt queue exhausted.");
    }

    return next as TAnswer;
  };
}

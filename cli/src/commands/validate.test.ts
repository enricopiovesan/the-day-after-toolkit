import { cp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { executeValidateCommand } from "./validate.js";

describe("executeValidateCommand", () => {
  it("returns a json-rendered validation report for a valid contract", async () => {
    const repoRoot = await copyFixtureRepo("valid-repo");

    const contractPath = join(repoRoot, "cdad/payment/retry/contract.yaml");
    const execution = await executeValidateCommand(
      {
        path: contractPath,
        format: "json"
      },
      {
        cwd: repoRoot
      }
    );

    const parsed = JSON.parse(execution.output) as Record<string, unknown>;

    expect(execution.report.exitCode).toBe(0);
    expect(execution.report.format).toBe("json");
    expect(parsed.generatedBy).toBe("cdad validate");
    expect(Array.isArray(parsed.files)).toBe(true);
  });

  it("prefers yaml over generated json siblings when validating a directory", async () => {
    const repoRoot = await copyFixtureRepo("valid-repo");
    await writeFile(
      join(repoRoot, "cdad/payment/retry/contract.json"),
      `{
  "_comment": "Auto-generated from payment/retry contract.yaml.",
  "id": "payment/retry",
  "version": "0.1.0",
  "owner": "Payments",
  "state": "active",
  "name": "Payment Retry",
  "description": "Keep the payment flow moving when a transient failure occurs.",
  "inputs": [],
  "outputs": [],
  "non_goals": [],
  "use_cases": [],
  "open_questions": []
}`,
      "utf8"
    );

    const execution = await executeValidateCommand(
      {
        path: join(repoRoot, "cdad/payment/retry"),
        format: "json"
      },
      {
        cwd: repoRoot
      }
    );

    expect(execution.report.exitCode).toBe(0);
    expect(execution.report.files).toHaveLength(1);
    expect(execution.report.files[0]?.filePath).toContain("contract.yaml");
  });

  it("returns validation failures for a checked-in invalid fixture repo", async () => {
    const repoRoot = await copyFixtureRepo("invalid-repo");

    const execution = await executeValidateCommand(
      {
        path: join(repoRoot, "cdad/payment/retry/contract.yaml"),
        format: "json"
      },
      {
        cwd: repoRoot
      }
    );

    const parsed = JSON.parse(execution.output) as {
      totals: { errors: number; warnings: number };
      files: Array<{ issues: Array<{ code: string; severity: string; message: string }> }>;
    };

    expect(execution.report.exitCode).toBe(2);
    expect(parsed.totals.errors).toBeGreaterThan(0);
    expect(parsed.totals.warnings).toBeGreaterThan(0);
    expect(parsed.files[0]?.issues.some((issue) => issue.code === "schema" && issue.severity === "error")).toBe(true);
    expect(
      parsed.files[0]?.issues.some((issue) => issue.code === "anti-pattern" && issue.severity === "warning")
    ).toBe(true);
  });

  it("validates every checked-in fixture contract when --all is set", async () => {
    const repoRoot = await copyFixtureRepo("all-repo");

    const execution = await executeValidateCommand(
      {
        all: true,
        format: "json"
      },
      {
        cwd: repoRoot
      }
    );

    const parsed = JSON.parse(execution.output) as { files: Array<{ filePath: string }> };

    expect(execution.report.exitCode).toBe(0);
    expect(execution.report.totals.files).toBe(2);
    expect(parsed.files).toHaveLength(2);
  });

  it("reports dependency cycle failures from a checked-in fixture repo", async () => {
    const repoRoot = await copyFixtureRepo("cycle-repo");

    const execution = await executeValidateCommand(
      {
        all: true,
        format: "json"
      },
      {
        cwd: repoRoot
      }
    );

    const parsed = JSON.parse(execution.output) as {
      totals: { errors: number };
      files: Array<{ issues: Array<{ code: string; message: string }> }>;
    };

    expect(execution.report.exitCode).toBe(2);
    expect(parsed.totals.errors).toBeGreaterThan(0);
    expect(
      parsed.files.some((file) =>
        file.issues.some((issue) => issue.code === "dependency" && issue.message.includes("Circular dependency detected"))
      )
    ).toBe(true);
  });
});

async function copyFixtureRepo(
  name: "valid-repo" | "invalid-repo" | "all-repo" | "cycle-repo"
): Promise<string> {
  const fixtureRoot = fileURLToPath(new URL(`../../test-fixtures/validate/${name}`, import.meta.url));
  const sandboxRoot = join(tmpdir(), `cdad-validate-fixture-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(sandboxRoot, { recursive: true });
  const workingDir = join(sandboxRoot, "repo");

  await cp(fixtureRoot, workingDir, { recursive: true });
  await writeFile(join(workingDir, "package.json"), JSON.stringify({ name: "cdad", private: true }, null, 2), "utf8");

  return workingDir;
}

import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { executeValidateCommand } from "./validate.js";

describe("executeValidateCommand", () => {
  it("returns a json-rendered validation report for a valid contract", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": VALID_CONTRACT
    });

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
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": VALID_CONTRACT,
      "cdad/payment/retry/contract.json": `{
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
}`
    });

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
});

async function createRepoFixture(
  files: Record<string, string> = {}
): Promise<string> {
  const repoRoot = join(tmpdir(), `cdad-validate-command-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(repoRoot, { recursive: true });
  await writeFile(
    join(repoRoot, "package.json"),
    JSON.stringify({ name: "cdad", private: true }, null, 2),
    "utf8"
  );

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = join(repoRoot, relativePath);
    await mkdir(join(filePath, ".."), { recursive: true });
    await writeFile(filePath, contents, "utf8");
  }

  return repoRoot;
}

const VALID_CONTRACT = `id: payment/retry
version: 0.1.0
owner: Payments
state: active
name: Payment Retry
description: Keep the payment flow moving when a transient failure occurs.
inputs: []
outputs: []
non_goals: []
use_cases: []
open_questions: []
`;

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { VALIDATE_HOOK_SCRIPT } from "./constants.js";
import {
  installValidateHook,
  renderValidationReportJson,
  renderValidationReportText,
  validateContracts
} from "./validator.js";

describe("validateContracts", () => {
  it("validates a minimum contract from a file path", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": MINIMUM_CONTRACT
    });

    const contractPath = join(repoRoot, "cdad/payment/retry/contract.yaml");
    const report = await validateContracts(
      {
        path: contractPath,
        format: "text"
      },
      { cwd: repoRoot }
    );

    const text = renderValidationReportText(report);

    expect(report.totals.files).toBe(1);
    expect(report.totals.errors).toBe(0);
    expect(report.totals.warnings).toBe(0);
    expect(report.exitCode).toBe(0);
    expect(text).toContain("cdad validate — Contract Validation Report");
    expect(text).toContain("No validation issues found.");
    expect(text).toContain("Next step: commit the validated contract.");
  });

  it("validates every contract under a directory when --all is set", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": MINIMUM_CONTRACT,
      "cdad/payment/retry-extended/contract.json": JSON.stringify(EXTENDED_CONTRACT, null, 2)
    });

    const report = await validateContracts(
      {
        all: true,
        format: "json"
      },
      { cwd: repoRoot }
    );

    const parsed = JSON.parse(renderValidationReportJson(report)) as Record<string, unknown>;

    expect(report.totals.files).toBe(2);
    expect(report.exitCode).toBe(0);
    expect(Array.isArray(parsed.files)).toBe(true);
    expect((parsed.files as readonly unknown[]).length).toBe(2);
    expect(textFilePaths(report)).toEqual([
      join(repoRoot, "cdad/payment/retry-extended/contract.json"),
      join(repoRoot, "cdad/payment/retry/contract.yaml")
    ]);
  });

  it("flags implementation language as a warning and upgrades that warning to an error in strict mode", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": WARNING_CONTRACT
    });

    const warningReport = await validateContracts(
      {
        path: join(repoRoot, "cdad/payment/retry/contract.yaml"),
        format: "text"
      },
      { cwd: repoRoot }
    );
    const strictReport = await validateContracts(
      {
        path: join(repoRoot, "cdad/payment/retry/contract.yaml"),
        strict: true,
        format: "text"
      },
      { cwd: repoRoot }
    );

    expect(warningReport.totals.warnings).toBe(1);
    expect(warningReport.exitCode).toBe(0);
    expect(strictReport.totals.warnings).toBe(1);
    expect(strictReport.exitCode).toBe(2);
    expect(renderValidationReportText(strictReport)).toContain("Strict mode: on");
  });

  it("reports schema errors when required fields are missing", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": MISSING_OWNER_CONTRACT
    });

    const report = await validateContracts(
      {
        path: join(repoRoot, "cdad/payment/retry/contract.yaml"),
        format: "text"
      },
      { cwd: repoRoot }
    );

    const issues = report.files[0]?.issues ?? [];

    expect(report.totals.errors).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.code === "schema" && issue.message.includes("owner"))).toBe(true);
  });

  it("installs a POSIX pre-commit hook", async () => {
    const repoRoot = await createRepoFixture();
    await mkdir(join(repoRoot, ".git/hooks"), { recursive: true });

    const report = await installValidateHook(repoRoot);
    const hookPath = join(repoRoot, ".git/hooks/pre-commit");
    const hookSource = await readFile(hookPath, "utf8");
    const hookStat = await stat(hookPath);

    expect(report.hookInstalled).toBe(true);
    expect(hookSource).toBe(VALIDATE_HOOK_SCRIPT);
    expect(hookStat.isFile()).toBe(true);
  });
});

async function createRepoFixture(
  files: Record<string, string> = {}
): Promise<string> {
  const repoRoot = join(tmpdir(), `cdad-validate-${Date.now()}-${Math.random().toString(16).slice(2)}`);
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

function textFilePaths(report: Awaited<ReturnType<typeof validateContracts>>): string[] {
  return [...report.files.map((file) => file.filePath)].sort();
}

const MINIMUM_CONTRACT = `id: payment/retry
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

const WARNING_CONTRACT = `id: payment/retry
version: 0.1.0
owner: Payments
state: active
name: Payment Retry
description: Retry failed payments with a short timeout window.
inputs: []
outputs: []
non_goals: []
use_cases: []
open_questions: []
`;

const MISSING_OWNER_CONTRACT = `id: payment/retry
version: 0.1.0
state: active
name: Payment Retry
description: Keep the payment flow moving when a transient failure occurs.
inputs: []
outputs: []
non_goals: []
use_cases: []
open_questions: []
`;

const EXTENDED_CONTRACT = {
  id: "payment/retry/extended",
  version: "1.2.0",
  owner: "Payments",
  state: "active",
  name: "Payment Retry",
  description: "Keep the customer payment flow moving when an upstream authorization fails.",
  inputs: [],
  outputs: [],
  non_goals: [],
  use_cases: [],
  open_questions: [],
  dependencies: [],
  performance: {
    response_time_p99_ms: 200,
    throughput_rps: 50,
    notes: "Handles online checkout requests only."
  },
  error_handling: [],
  trust_zone: "internal",
  rate_limits: {
    requests_per_minute: 60,
    burst_allowance: 10,
    notes: "Applies only to public API calls."
  },
  constraint_history: [],
  version_history: [
    {
      version: "1.0.0",
      date: "2026-01-01",
      changed: "Initial release."
    }
  ]
} as const;

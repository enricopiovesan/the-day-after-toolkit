import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { executeInitCommand } from "./init.js";
import { executeValidateCommand } from "./validate.js";

describe("executeInitCommand", () => {
  it("scaffolds a minimum viable contract triple without prompts", async () => {
    const repoRoot = await createRepoFixture();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const execution = await executeInitCommand(
      "payment/retry",
      {
        noPrompts: true,
        output: "cdad"
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z"),
        prompt: vi.fn()
      }
    );

    const yaml = await readFile(join(repoRoot, "cdad/payment/retry/contract.yaml"), "utf8");
    const json = await readFile(join(repoRoot, "cdad/payment/retry/contract.json"), "utf8");
    const markdown = await readFile(join(repoRoot, "cdad/payment/retry/contract.md"), "utf8");
    const validation = await executeValidateCommand(
      {
        path: join(repoRoot, "cdad/payment/retry"),
        format: "json"
      },
      {
        cwd: repoRoot
      }
    );

    expect(execution.output).toContain("Scaffolding complete for payment/retry.");
    expect(yaml).toContain("id: payment/retry");
    expect(yaml).toContain("version: 0.1.0");
    expect(json).toContain("\"_comment\": \"Auto-generated from payment/retry contract.yaml.\"");
    expect(markdown).toContain("# Payment Retry");
    expect(markdown).toContain("No inputs declared yet.");
    expect(validation.report.exitCode).toBe(0);

    log.mockRestore();
  });

  it("uses prompted values and carries roadmap capture notes into the yaml scaffold", async () => {
    const repoRoot = await createRepoFixture({
      "cdad-roadmap.md": `# Transformation Roadmap

## Phase 1

### payment/retry
**Priority score:** 9
**Primary gaps:** constraint history
**Suggested action:** Run \`cdad init payment/retry\` to scaffold the contract.
**What to capture first:** Preserve the retry safety rule before touching implementation details.
`
    });

    await executeInitCommand(
      "payment/retry",
      {
        output: "cdad"
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z"),
        prompt: async () => ({
          name: "Payment Retry",
          owner: "payments-team",
          state: "active",
          description: "Decide whether a failed payment can be retried without double charging."
        })
      }
    );

    const yaml = await readFile(join(repoRoot, "cdad/payment/retry/contract.yaml"), "utf8");
    const markdown = await readFile(join(repoRoot, "cdad/payment/retry/contract.md"), "utf8");

    expect(yaml).toContain("# Roadmap note: capture this first while filling in the contract.");
    expect(yaml).toContain("# Preserve the retry safety rule before touching implementation details.");
    expect(yaml).toContain("owner: payments-team");
    expect(yaml).toContain("state: active");
    expect(markdown).toContain("Decide whether a failed payment can be retried without double charging.");
    expect(markdown).toContain("## Open questions");
    expect(markdown).toContain("[]");
  });

  it("rejects invalid capability ids before writing files", async () => {
    const repoRoot = await createRepoFixture();

    await expect(
      executeInitCommand(
        "Payment Retry",
        {
          noPrompts: true
        },
        {
          cwd: repoRoot,
          now: () => new Date("2026-04-03T00:00:00Z"),
          prompt: vi.fn()
        }
      )
    ).rejects.toThrow("Capability id must use lowercase semantic naming");
  });
});

async function createRepoFixture(
  files: Record<string, string> = {}
): Promise<string> {
  const repoRoot = join(tmpdir(), `cdad-init-command-${Date.now()}-${Math.random().toString(16).slice(2)}`);
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

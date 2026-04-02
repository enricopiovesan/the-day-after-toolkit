import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { scanRepository } from "./scanner.js";

describe("static scan", () => {
  it("detects the positive repository legibility signals without reading business logic", async () => {
    const root = await createFixtureRepo({
      includeDocsDirectory: true,
      includeTestFiles: true
    });

    const summary = await scanRepository(root);

    expect(summary.totalCount).toBe(7);
    expect(summary.foundCount).toBe(5);
    expect(summary.positivePoints).toBe(10);
    expect(summary.penaltyPoints).toBe(0);
    expect(summary.score).toBe(10);
    expect(summary.findings.find((finding) => finding.key === "agentContextFile")?.found).toBe(
      true
    );
    expect(summary.findings.find((finding) => finding.key === "documentationDirectoryAbsent")?.found).toBe(
      false
    );
    expect(summary.findings.find((finding) => finding.key === "testsAbsent")?.found).toBe(false);
  });

  it("applies penalties when docs or tests are missing", async () => {
    const root = await createFixtureRepo({
      includeDocsDirectory: false,
      includeTestFiles: false
    });

    const summary = await scanRepository(root);

    expect(summary.foundCount).toBe(7);
    expect(summary.positivePoints).toBe(10);
    expect(summary.penaltyPoints).toBe(3);
    expect(summary.score).toBe(7);
    expect(summary.findings.find((finding) => finding.key === "documentationDirectoryAbsent")?.found).toBe(
      true
    );
    expect(summary.findings.find((finding) => finding.key === "testsAbsent")?.found).toBe(true);
  });
});

async function createFixtureRepo(options: {
  readonly includeDocsDirectory: boolean;
  readonly includeTestFiles: boolean;
}): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "cdad-audit-"));

  await writeFile(join(root, "README.md"), "A".repeat(1024));
  await writeFile(join(root, "CLAUDE.md"), "# context");
  await writeFile(join(root, "service.openapi.yaml"), "openapi: 3.0.0");

  await mkdir(join(root, "adr"), { recursive: true });
  await writeFile(join(root, "adr", "0001.md"), "# adr");

  await mkdir(join(root, "cdad", "payment", "retry"), { recursive: true });
  await writeFile(join(root, "cdad", "payment", "retry", "contract.yaml"), "id: payment/retry");

  if (options.includeDocsDirectory) {
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "index.md"), "# docs");
  }

  if (options.includeTestFiles) {
    await mkdir(join(root, "tests"), { recursive: true });
    await writeFile(join(root, "tests", "example.test.ts"), "it('example', () => undefined);");
  }

  return root;
}

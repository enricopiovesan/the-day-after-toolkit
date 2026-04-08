import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), "utf8");
}

async function expectRepoPathToExist(relativePath: string): Promise<void> {
  await expect(access(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)))).resolves.toBeUndefined();
}

describe("configuration assets", () => {
  it("keeps the legibility auditor questions aligned with the spec wording", async () => {
    const prompt = await readRepoFile("claude-configs/legibility-auditor.md");

    expect(prompt).toContain("Could you hand this capability to a capable engineer who has never");
    expect(prompt).toContain("spoken to anyone on your team, and have them make a safe change to it");
    expect(prompt).toContain("Can someone understand WHY this capability works this way");
    expect(prompt).toContain("Can someone identify what was tried before, what failed, and why");
    expect(prompt).toContain("Can someone understand why this capability calls what it calls");
    expect(prompt).toContain("Can someone identify every code path that exists because of a specific");
    expect(prompt).toContain("Do not paraphrase the diagnostic question or the four follow-up questions.");
  });

  it("grounds the contract author prompt in real toolkit files and commands", async () => {
    const prompt = await readRepoFile("claude-configs/contract-author.md");

    expect(prompt).toContain("docs/contract-schema-reference.md");
    expect(prompt).toContain("schemas/minimum-viable-contract.schema.json");
    expect(prompt).toContain("templates/minimum-viable-contract/contract.yaml");
    expect(prompt).toContain("templates/worked-examples/payment-retry/contract.yaml");
    expect(prompt).toContain("cdad init <capability-id>");
    expect(prompt).toContain("cdad validate");

    await expectRepoPathToExist("docs/contract-schema-reference.md");
    await expectRepoPathToExist("schemas/minimum-viable-contract.schema.json");
    await expectRepoPathToExist("templates/minimum-viable-contract/contract.yaml");
    await expectRepoPathToExist("templates/worked-examples/payment-retry/contract.yaml");
  });

  it("keeps the repo-level agent context tied to real repo guidance", async () => {
    const prompt = await readRepoFile("agent-configs/CLAUDE.md");

    expect(prompt).toContain("README.md");
    expect(prompt).toContain("docs/cli-reference.md");
    expect(prompt).toContain("docs/contract-schema-reference.md");
    expect(prompt).toContain("openspec/specs/repo-governance/spec.md");
    expect(prompt).toContain("ref/the-day-after-toolkit-spec.md");
    expect(prompt).toContain("npm test");
    expect(prompt).toContain("cdad validate --all --strict");

    await expectRepoPathToExist("README.md");
    await expectRepoPathToExist("docs/cli-reference.md");
    await expectRepoPathToExist("docs/contract-schema-reference.md");
    await expectRepoPathToExist("openspec/specs/repo-governance/spec.md");
    await expectRepoPathToExist("ref/the-day-after-toolkit-spec.md");
  });
});

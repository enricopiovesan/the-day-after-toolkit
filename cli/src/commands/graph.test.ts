import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { executeGraphCommand } from "./graph.js";

describe("executeGraphCommand", () => {
  it("renders mermaid, json, and markdown graph artifacts for repo contracts", async () => {
    const repoRoot = await copyFixtureRepo("full-repo");

    const execution = await executeGraphCommand(
      undefined,
      {
        output: join(repoRoot, "graph-output")
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z")
      }
    );

    const markdown = await readFile(join(repoRoot, "graph-output/cdad-graph.md"), "utf8");
    const mermaid = await readFile(join(repoRoot, "graph-output/cdad-graph.mmd"), "utf8");
    const json = await readFile(join(repoRoot, "graph-output/cdad-graph.json"), "utf8");

    expect(execution.output).toContain("Found 4 contracts.");
    expect(execution.output).toContain("Dependency edges: 2");
    expect(markdown).toContain("# Capability Graph");
    expect(markdown).toContain("| payment | 2 | 1 | 1 | 0 |");
    expect(markdown).toContain("legacy/session: Use auth/session/login instead.");
    expect(markdown).toContain("Resolve whether MFA belongs in this capability.");
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("payment_retry");

    const parsed = JSON.parse(json) as {
      capabilities: Array<{ id: string; dependencies: string[] }>;
      cycles: string[][];
    };
    expect(parsed.capabilities.find((node) => node.id === "auth/session/login")?.dependencies).toEqual([
      "payment/processor/status",
      "payment/retry"
    ]);
    expect(parsed.cycles).toEqual([]);
  });

  it("renders a capability subgraph and respects disabled outputs", async () => {
    const repoRoot = await copyFixtureRepo("full-repo");

    const execution = await executeGraphCommand(
      undefined,
      {
        capability: "auth/session/login",
        output: join(repoRoot, "graph-output"),
        mermaid: false,
        json: false
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z")
      }
    );

    const markdown = await readFile(join(repoRoot, "graph-output/cdad-graph.md"), "utf8");

    expect(execution.renderResult.mermaidPath).toBeNull();
    expect(execution.renderResult.jsonPath).toBeNull();
    expect(execution.output).toContain("Found 3 contracts.");
    expect(markdown).toContain("auth/session/login");
    expect(markdown).toContain("payment/retry");
    expect(markdown).toContain("payment/processor/status");
  });

  it("reports circular dependencies in terminal output and markdown", async () => {
    const repoRoot = await copyFixtureRepo("cycle-repo");

    const execution = await executeGraphCommand(
      undefined,
      {
        output: join(repoRoot, "graph-output")
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z")
      }
    );

    const markdown = await readFile(join(repoRoot, "graph-output/cdad-graph.md"), "utf8");

    expect(execution.output).toContain("Circular dependencies detected: 1");
    expect(markdown).toContain("a/one -> b/two -> a/one");
  });
});

async function copyFixtureRepo(name: "full-repo" | "cycle-repo"): Promise<string> {
  const fixtureRoot = fileURLToPath(new URL(`../../test-fixtures/graph/${name}`, import.meta.url));
  const sandboxRoot = join(tmpdir(), `cdad-graph-fixture-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(sandboxRoot, { recursive: true });
  const repoRoot = join(sandboxRoot, "repo");

  await cp(fixtureRoot, repoRoot, { recursive: true });
  await writeFile(join(repoRoot, "package.json"), JSON.stringify({ name: "cdad", private: true }, null, 2), "utf8");

  return repoRoot;
}

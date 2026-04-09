import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { generateWorkedExamples } from "./generate-examples.js";

const WORKED_EXAMPLES_FIXTURE = resolve("..", "templates", "worked-examples");

describe("generateWorkedExamples", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((directory) => rm(directory, { force: true, recursive: true })));
    tempDirs.length = 0;
  });

  it("reports no drift when worked examples are already synchronized", async () => {
    const rootDir = await createFixtureCopy();

    const result = await generateWorkedExamples({ rootDir, check: true });

    expect(result.processed).toBe(2);
    expect(result.drifts).toEqual([]);
  });

  it("fails in check mode when a generated artifact drifts", async () => {
    const rootDir = await createFixtureCopy();
    const driftPath = join(rootDir, "payment-retry", "contract.json");
    const original = await readFile(driftPath, "utf8");

    await writeFile(driftPath, `${original}\n`, "utf8");

    await expect(generateWorkedExamples({ rootDir, check: true })).rejects.toThrow(
      /Generated artifact drift detected/
    );
    expect(await readFile(driftPath, "utf8")).toBe(`${original}\n`);
  });

  it("rewrites generated artifacts when not in check mode", async () => {
    const rootDir = await createFixtureCopy();
    const driftPath = join(rootDir, "payment-retry", "contract.json");
    const original = await readFile(driftPath, "utf8");

    await writeFile(driftPath, `${original}\n`, "utf8");

    const result = await generateWorkedExamples({ rootDir });

    expect(result.processed).toBe(2);
    expect(result.drifts).toEqual([
      {
        yamlPath: join(rootDir, "payment-retry", "contract.yaml"),
        generatedPath: driftPath
      }
    ]);
    expect(await readFile(driftPath, "utf8")).toBe(original);
  });

  async function createFixtureCopy(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), "cdad-worked-examples-"));
    tempDirs.push(directory);
    await cp(WORKED_EXAMPLES_FIXTURE, directory, { recursive: true });
    return directory;
  }
});

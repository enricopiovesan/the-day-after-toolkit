/*
 * Regenerates worked-example JSON/Markdown artifacts from contract YAML.
 * Spec reference: templates and worked-example sync behavior.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { JSON_SCHEMA, load as loadYaml } from "js-yaml";

import { renderContractMarkdown, syncGeneratedArtifacts } from "../contracts/converter.js";
import type { ContractDocument } from "../contracts/scaffolder.js";
import { pathExists } from "./file.js";

type WorkedExampleContract = ContractDocument;

export interface GenerateExamplesOptions {
  readonly rootDir?: string;
  readonly check?: boolean;
}

export interface WorkedExampleDrift {
  readonly yamlPath: string;
  readonly generatedPath: string;
}

export interface GenerateExamplesResult {
  readonly processed: number;
  readonly drifts: readonly WorkedExampleDrift[];
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(MODULE_DIR, "..", "..", "..");
const WORKED_EXAMPLES_ROOT = resolve(REPO_ROOT, "templates", "worked-examples");
const STABLE_SYNC_DATE = new Date("2024-01-15T00:00:00.000Z");
const IS_DIRECT_EXECUTION = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

export async function generateWorkedExamples(
  options: GenerateExamplesOptions = {}
): Promise<GenerateExamplesResult> {
  const examplesRoot = resolve(options.rootDir ?? WORKED_EXAMPLES_ROOT);
  const yamlPaths = await discoverWorkedExampleYamlPaths(examplesRoot);
  const drifts: WorkedExampleDrift[] = [];

  for (const yamlPath of yamlPaths) {
    const contract = await readWorkedExampleContract(yamlPath);
    const jsonPath = resolve(dirname(yamlPath), "contract.json");
    const markdownPath = resolve(dirname(yamlPath), "contract.md");
    const beforeJson = await readSiblingIfPresent(yamlPath, "contract.json");
    const beforeMarkdown = await readSiblingIfPresent(yamlPath, "contract.md");
    const extended = isExtendedContract(contract);
    const capabilityId = readCapabilityId(contract, yamlPath);
    const expectedJson = renderGeneratedJson(contract, capabilityId, extended);
    const expectedMarkdown = `${renderContractMarkdown(contract, STABLE_SYNC_DATE)}\n`;

    if (beforeJson !== expectedJson) {
      drifts.push({ yamlPath, generatedPath: jsonPath });
    }

    if (beforeMarkdown !== expectedMarkdown) {
      drifts.push({ yamlPath, generatedPath: markdownPath });
    }

    if (!options.check) {
      await syncGeneratedArtifacts({
        yamlPath,
        capabilityId,
        extended,
        now: () => STABLE_SYNC_DATE
      });
    }
  }

  if (options.check && drifts.length > 0) {
    for (const drift of drifts) {
      throw new Error(
        `Generated artifact drift detected for ${drift.yamlPath}. Regenerate ${drift.generatedPath} with npm run generate-examples.`
      );
    }
  }

  return {
    processed: yamlPaths.length,
    drifts
  };
}

async function discoverWorkedExampleYamlPaths(rootDir: string): Promise<string[]> {
  const exampleDirectories = ["payment-retry", "payment-retry-extended"].map((name) => resolve(rootDir, name));
  const yamlPaths = exampleDirectories.map((directory) => resolve(directory, "contract.yaml"));

  for (const yamlPath of yamlPaths) {
    if (!(await pathExists(yamlPath))) {
      throw new Error(`Worked example contract not found: ${yamlPath}`);
    }
  }

  return yamlPaths;
}

async function readSiblingIfPresent(yamlPath: string, fileName: string): Promise<string | null> {
  const generatedPath = resolve(dirname(yamlPath), fileName);
  if (!(await pathExists(generatedPath))) {
    return null;
  }

  return readFile(generatedPath, "utf8");
}

async function readWorkedExampleContract(yamlPath: string): Promise<WorkedExampleContract> {
  const parsed = loadYaml(await readFile(yamlPath, "utf8"), { schema: JSON_SCHEMA });

  if (!isWorkedExampleContract(parsed)) {
    throw new Error(`Worked example YAML could not be parsed from ${yamlPath}.`);
  }

  return parsed;
}

function isExtendedContract(parsed: WorkedExampleContract): boolean {
  return [
    "dependencies",
    "performance",
    "error_handling",
    "trust_zone",
    "rate_limits",
    "constraint_history",
    "version_history"
  ].some((field) => field in parsed);
}

function readCapabilityId(contract: WorkedExampleContract, yamlPath: string): string {
  if (contract.id.length > 0) {
    return contract.id;
  }

  throw new Error(`Worked example contract id is missing or invalid in ${yamlPath}.`);
}

function renderGeneratedJson(contract: WorkedExampleContract, capabilityId: string, extended: boolean): string {
  const commentSuffix = extended ? "extended contract.yaml" : "contract.yaml";

  return `${JSON.stringify(
    {
      _comment: `Auto-generated from ${capabilityId} ${commentSuffix}.`,
      ...contract
    },
    null,
    2
  )}\n`;
}

function isWorkedExampleContract(value: unknown): value is WorkedExampleContract {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function main(): Promise<void> {
  const result = await generateWorkedExamples({
    check: process.argv.includes("--check")
  });

  if (result.drifts.length === 0) {
    console.log(`Processed ${result.processed} worked examples with no drift.`);
    return;
  }

  console.log(`Processed ${result.processed} worked examples and refreshed ${result.drifts.length} generated artifacts.`);
}

if (IS_DIRECT_EXECUTION) {
  main().catch((error: unknown) => {
    console.error("Failed to synchronize worked examples:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    process.exit(1);
  });
}

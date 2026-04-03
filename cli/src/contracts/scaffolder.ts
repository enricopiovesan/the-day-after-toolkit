/*
 * Contract scaffolder for cdad init.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { dump as dumpYaml } from "js-yaml";

import { pathExists } from "../utils/file.js";
import { syncGeneratedArtifacts } from "./converter.js";

export type ContractState = "draft" | "active" | "deprecated" | "retired";

type ContractFieldType = "string" | "number" | "boolean" | "object" | "array";

interface ContractInput {
  readonly name: string;
  readonly type: ContractFieldType;
  readonly required: boolean;
  readonly constraints: string;
}

interface ContractOutput {
  readonly name: string;
  readonly type: ContractFieldType;
  readonly guarantees: string;
}

interface ContractDependency {
  readonly id: string;
  readonly version: string;
  readonly rationale: string;
}

interface ContractPerformance {
  readonly response_time_p99_ms: number;
  readonly throughput_rps: number;
  readonly notes: string;
}

interface ContractErrorHandlingEntry {
  readonly error: string;
  readonly required_response: string;
}

interface ContractRateLimits {
  readonly requests_per_minute: number;
  readonly burst_allowance: number;
  readonly notes: string;
}

interface InheritedConstraint {
  readonly source: "company" | "org" | "project";
  readonly constraint: string;
}

interface ConstraintHistoryEntry {
  readonly date: string;
  readonly context: string;
  readonly outcome: string;
  readonly lesson: string;
}

interface VersionHistoryEntry {
  readonly version: string;
  readonly date: string;
  readonly changed: string;
}

export interface MinimumContractDocument {
  readonly id: string;
  readonly version: string;
  readonly owner: string;
  readonly state: ContractState;
  readonly name: string;
  readonly description: string;
  readonly inputs: readonly ContractInput[];
  readonly outputs: readonly ContractOutput[];
  readonly non_goals: readonly string[];
  readonly use_cases: readonly string[];
  readonly open_questions: readonly string[];
}

export interface ExtendedContractDocument extends MinimumContractDocument {
  readonly dependencies: readonly ContractDependency[];
  readonly performance: ContractPerformance;
  readonly error_handling: readonly ContractErrorHandlingEntry[];
  readonly trust_zone: "internal" | "external" | "privileged";
  readonly rate_limits: ContractRateLimits;
  readonly inherited_constraints: readonly InheritedConstraint[];
  readonly constraint_history: readonly ConstraintHistoryEntry[];
  readonly deprecation_timeline: string | null;
  readonly migration_path: string | null;
  readonly versioning_strategy: string;
  readonly version_history: readonly VersionHistoryEntry[];
}

export type ContractDocument = MinimumContractDocument | ExtendedContractDocument;

export interface InitPromptAnswerMap {
  readonly name: string;
  readonly owner: string;
  readonly state: ContractState;
  readonly description: string;
}

export interface InitPromptQuestion {
  readonly type: "input" | "list";
  readonly name: keyof InitPromptAnswerMap;
  readonly message: string;
  readonly default?: string;
  readonly choices?: readonly { readonly name: string; readonly value: ContractState }[];
}

/* eslint-disable no-unused-vars */
type InitPromptRunner = (
  questions: readonly InitPromptQuestion[]
) => Promise<InitPromptAnswerMap>;
/* eslint-enable no-unused-vars */

export interface InitRuntime {
  readonly cwd: string;
  readonly now: () => Date;
  readonly prompt: InitPromptRunner;
}

export interface ScaffoldContractOptions {
  readonly capabilityId: string;
  readonly outputDir?: string;
  readonly extended?: boolean;
  readonly noPrompts?: boolean;
}

export interface ScaffoldContractResult {
  readonly contract: ContractDocument;
  readonly contractDir: string;
  readonly yamlPath: string;
  readonly jsonPath: string;
  readonly markdownPath: string;
  readonly roadmapCaptureNote: string | null;
}

const CAPABILITY_ID_PATTERN = /^[a-z0-9]+(?:\/[a-z0-9]+)+$/;
const DEFAULT_OWNER = "team-or-individual";
const DEFAULT_DESCRIPTION = "Describe what this capability does and why it exists.";
const DEFAULT_USE_CASE = "Describe the business context this capability serves.";
const DEFAULT_OPEN_QUESTION = "What still needs to be decided before this contract becomes authoritative?";
const DEFAULT_NON_GOAL = "This capability does not yet define its non-goals.";
const DEFAULT_VERSIONING_STRATEGY =
  "Use MAJOR for breaking contract changes, MINOR for backward-compatible additions, and PATCH for corrections to the contract text.";

export async function scaffoldContract(
  options: ScaffoldContractOptions,
  runtime: InitRuntime
): Promise<ScaffoldContractResult> {
  if (!CAPABILITY_ID_PATTERN.test(options.capabilityId)) {
    throw new Error(
      `Capability id must use lowercase semantic naming like payment/retry or auth/session/login. Received ${options.capabilityId}.`
    );
  }

  const outputRoot = resolve(runtime.cwd, options.outputDir ?? "cdad");
  const contractDir = join(outputRoot, options.capabilityId);
  const yamlPath = join(contractDir, "contract.yaml");
  const jsonPath = join(contractDir, "contract.json");
  const markdownPath = join(contractDir, "contract.md");

  await assertTargetPathsAreAvailable([yamlPath, jsonPath, markdownPath]);
  await mkdir(contractDir, { recursive: true });

  const defaults = createPromptDefaults(options.capabilityId);
  const promptAnswers = options.noPrompts
    ? defaults
    : await runtime.prompt([
      {
        type: "input",
        name: "name",
        message: "Capability name (human-readable):",
        default: defaults.name
      },
      {
        type: "input",
        name: "owner",
        message: "Owner (team or individual):",
        default: defaults.owner
      },
      {
        type: "list",
        name: "state",
        message: "State:",
        default: defaults.state,
        choices: [
          { name: "draft", value: "draft" },
          { name: "active", value: "active" },
          { name: "deprecated", value: "deprecated" },
          { name: "retired", value: "retired" }
        ]
      },
      {
        type: "input",
        name: "description",
        message: "One-sentence description (what it does and why it exists):",
        default: defaults.description
      }
    ]);
  const answers = normalizePromptAnswers(promptAnswers, defaults);

  const contract = options.extended
    ? createExtendedContract(options.capabilityId, answers, runtime.now)
    : createMinimumContract(options.capabilityId, answers);
  const roadmapCaptureNote = await readRoadmapCaptureNote(runtime.cwd, options.capabilityId);
  const yamlContents = renderContractYaml(contract, roadmapCaptureNote, options.extended ?? false);

  await writeFile(yamlPath, yamlContents, "utf8");

  const generated = await syncGeneratedArtifacts({
    yamlPath,
    capabilityId: options.capabilityId,
    extended: options.extended ?? false,
    now: runtime.now
  });

  return {
    contract: generated.contract,
    contractDir,
    yamlPath,
    jsonPath: generated.jsonPath,
    markdownPath: generated.markdownPath,
    roadmapCaptureNote
  };
}

function createPromptDefaults(capabilityId: string): InitPromptAnswerMap {
  return {
    name: humanizeCapabilityId(capabilityId),
    owner: DEFAULT_OWNER,
    state: "draft",
    description: DEFAULT_DESCRIPTION
  };
}

function normalizePromptAnswers(
  answers: InitPromptAnswerMap,
  defaults: InitPromptAnswerMap
): InitPromptAnswerMap {
  return {
    name: normalizePromptString(answers.name, defaults.name),
    owner: normalizePromptString(answers.owner, defaults.owner),
    state: answers.state,
    description: normalizePromptString(answers.description, defaults.description)
  };
}

function createMinimumContract(
  capabilityId: string,
  answers: InitPromptAnswerMap
): MinimumContractDocument {
  return {
    id: capabilityId,
    version: "0.1.0",
    owner: answers.owner.trim(),
    state: answers.state,
    name: answers.name.trim(),
    description: answers.description.trim(),
    inputs: [],
    outputs: [],
    non_goals: [DEFAULT_NON_GOAL],
    use_cases: [DEFAULT_USE_CASE],
    open_questions: answers.state === "active" ? [] : [DEFAULT_OPEN_QUESTION]
  };
}

function createExtendedContract(
  capabilityId: string,
  answers: InitPromptAnswerMap,
  now: () => Date
): ExtendedContractDocument {
  const version = "0.1.0";

  return {
    ...createMinimumContract(capabilityId, answers),
    dependencies: [],
    performance: {
      response_time_p99_ms: 0,
      throughput_rps: 0,
      notes: "Document the runtime thresholds that matter for this capability."
    },
    error_handling: [],
    trust_zone: "internal",
    rate_limits: {
      requests_per_minute: 0,
      burst_allowance: 0,
      notes: "Document any rate limits or note explicitly that none apply."
    },
    inherited_constraints: [],
    constraint_history: [],
    deprecation_timeline: null,
    migration_path: answers.state === "deprecated"
      ? "Document the migration path for dependents before this contract is retired."
      : null,
    versioning_strategy: DEFAULT_VERSIONING_STRATEGY,
    version_history: [
      {
        version,
        date: now().toISOString().slice(0, 10),
        changed: "Initial scaffold generated by cdad init."
      }
    ]
  };
}

function renderContractYaml(
  contract: ContractDocument,
  roadmapCaptureNote: string | null,
  extended: boolean
): string {
  const header = extended
    ? [
      "# Extended contract scaffold generated by cdad init.",
      "# contract.json and contract.md are generated artifacts. Edit contract.yaml and re-sync."
    ]
    : [
      "# Minimum viable contract scaffold generated by cdad init.",
      "# contract.json and contract.md are generated artifacts. Edit contract.yaml and re-sync."
    ];
  const roadmapLines = roadmapCaptureNote
    ? [
      "# Roadmap note: capture this first while filling in the contract.",
      ...wrapComment(roadmapCaptureNote)
    ]
    : [];
  const yamlDocument = dumpYaml(contract, {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false
  }).trimEnd();

  return [...header, ...roadmapLines, "", yamlDocument, ""].join("\n");
}

async function assertTargetPathsAreAvailable(paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    if (await pathExists(path)) {
      throw new Error(`Refusing to overwrite existing scaffold artifact: ${path}`);
    }
  }
}

async function readRoadmapCaptureNote(cwd: string, capabilityId: string): Promise<string | null> {
  const roadmapPath = resolve(cwd, "cdad-roadmap.md");

  if (!(await pathExists(roadmapPath))) {
    return null;
  }

  const source = await readFile(roadmapPath, "utf8");
  const lines = source.split(/\r?\n/);
  const headingPatterns = [
    `### ${capabilityId}`,
    `### 1. ${capabilityId}`,
    `### 2. ${capabilityId}`,
    `### 3. ${capabilityId}`
  ];
  const startIndex = lines.findIndex((line) => headingPatterns.includes(line.trim()));

  if (startIndex === -1) {
    return null;
  }

  const sectionLines: string[] = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (line.startsWith("### ") || line.startsWith("## ")) {
      break;
    }

    sectionLines.push(line);
  }

  const captureLine = sectionLines.find((line) => line.startsWith("**What to capture first:**"));
  return captureLine?.replace("**What to capture first:**", "").trim() ?? null;
}

function humanizeCapabilityId(capabilityId: string): string {
  return capabilityId
    .split("/")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function wrapComment(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => `# ${line.trim()}`);
}

function normalizePromptString(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/*
 * YAML-to-JSON and YAML-to-Markdown synchronization helpers.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { JSON_SCHEMA, load as loadYaml } from "js-yaml";

import type { ContractDocument } from "./scaffolder.js";

interface SyncGeneratedArtifactsOptions {
  readonly yamlPath: string;
  readonly capabilityId: string;
  readonly extended: boolean;
  readonly now: () => Date;
}

interface JsonContractDocument extends Record<string, unknown> {
  readonly _comment: string;
}

export interface SyncGeneratedArtifactsResult {
  readonly contract: ContractDocument;
  readonly jsonPath: string;
  readonly markdownPath: string;
}

export async function syncGeneratedArtifacts(
  options: SyncGeneratedArtifactsOptions
): Promise<SyncGeneratedArtifactsResult> {
  const rawYaml = await readFile(options.yamlPath, "utf8");
  const parsed = loadYaml(rawYaml, { schema: JSON_SCHEMA });

  if (!isContractDocument(parsed)) {
    throw new Error(`Generated contract could not be parsed from ${options.yamlPath}.`);
  }

  const contract = parsed;
  const directory = dirname(options.yamlPath);
  const jsonPath = join(directory, "contract.json");
  const markdownPath = join(directory, "contract.md");
  const commentSuffix = options.extended ? "extended contract.yaml" : "contract.yaml";
  const jsonContract: JsonContractDocument = {
    _comment: `Auto-generated from ${options.capabilityId} ${commentSuffix}.`,
    ...(contract as Record<string, unknown>)
  };

  await writeFile(jsonPath, `${JSON.stringify(jsonContract, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, `${renderContractMarkdown(contract, options.now())}\n`, "utf8");

  return {
    contract,
    jsonPath,
    markdownPath
  };
}

export function renderContractMarkdown(contract: ContractDocument, now: Date): string {
  const lines = [
    "---",
    "source: contract.yaml",
    "generated_by: cdad",
    `last_synced: ${now.toISOString()}`,
    "do_not_edit: true",
    "---",
    "",
    `# ${contract.name}`,
    "",
    `**ID:** \`${contract.id}\``,
    `**Version:** ${contract.version}`,
    `**Owner:** ${contract.owner}`,
    `**State:** ${contract.state}`,
    "",
    "## What this capability does",
    "",
    contract.description,
    "",
    "## What it needs",
    "",
    renderInputSection(contract),
    "",
    "## What it promises",
    "",
    renderOutputSection(contract),
    "",
    "## What it does NOT do",
    "",
    renderStringList(contract.non_goals),
    "",
    "## Business context",
    "",
    renderStringList(contract.use_cases),
    "",
    "## Behavioral rules",
    "",
    renderBehavioralRules(contract),
    "",
    "## Known constraints and history",
    "",
    renderConstraintHistory(contract),
    "",
    "## Dependencies",
    "",
    renderDependencies(contract),
    "",
    "## Open questions",
    "",
    renderOpenQuestions(contract.open_questions)
  ];

  return lines.join("\n");
}

function renderInputSection(contract: ContractDocument): string {
  if (contract.inputs.length === 0) {
    return "No inputs declared yet.";
  }

  return contract.inputs
    .map(
      (input) =>
        `- \`${input.name}\` (\`${input.type}\`, ${input.required ? "required" : "optional"}): ${normalizeSentence(input.constraints)}`
    )
    .join("\n");
}

function renderOutputSection(contract: ContractDocument): string {
  if (contract.outputs.length === 0) {
    return "No outputs declared yet.";
  }

  return contract.outputs
    .map((output) => `- \`${output.name}\` (\`${output.type}\`): ${normalizeSentence(output.guarantees)}`)
    .join("\n");
}

function renderBehavioralRules(contract: ContractDocument): string {
  if (!("performance" in contract)) {
    return "Not declared in the minimum viable contract.";
  }

  const lines = [
    `- Performance target: p99 ${contract.performance.response_time_p99_ms} ms, throughput ${contract.performance.throughput_rps} rps. ${normalizeSentence(contract.performance.notes)}`,
    `- Trust zone: ${contract.trust_zone}.`,
    `- Rate limits: ${contract.rate_limits.requests_per_minute} requests per minute with burst allowance ${contract.rate_limits.burst_allowance}. ${normalizeSentence(contract.rate_limits.notes)}`
  ];

  if (contract.error_handling.length > 0) {
    lines.push(...contract.error_handling.map((entry) => `- Error ${entry.error}: ${normalizeSentence(entry.required_response)}`));
  } else {
    lines.push("- No error-handling rules declared yet.");
  }

  if (contract.inherited_constraints.length > 0) {
    lines.push(
      ...contract.inherited_constraints.map(
        (entry) => `- Inherited from ${entry.source}: ${normalizeSentence(entry.constraint)}`
      )
    );
  }

  return lines.join("\n");
}

function renderConstraintHistory(contract: ContractDocument): string {
  if (!("constraint_history" in contract)) {
    return "Not declared in the minimum viable contract.";
  }

  if (contract.constraint_history.length === 0) {
    return "No constraint history declared yet.";
  }

  return contract.constraint_history
    .map(
      (entry) =>
        `- ${entry.date}: ${normalizeSentence(entry.context)} Outcome: ${normalizeSentence(entry.outcome)} Lesson: ${normalizeSentence(entry.lesson)}`
    )
    .join("\n");
}

function renderDependencies(contract: ContractDocument): string {
  if (!("dependencies" in contract)) {
    return "Not declared in the minimum viable contract.";
  }

  if (contract.dependencies.length === 0) {
    return "No dependencies declared yet.";
  }

  return contract.dependencies
    .map(
      (dependency) =>
        `- \`${dependency.id}\` (${dependency.version}): ${normalizeSentence(dependency.rationale)}`
    )
    .join("\n");
}

function renderOpenQuestions(openQuestions: readonly string[]): string {
  if (openQuestions.length === 0) {
    return "[]";
  }

  return renderStringList(openQuestions);
}

function renderStringList(values: readonly string[]): string {
  if (values.length === 0) {
    return "[]";
  }

  return values.map((value) => `- ${normalizeSentence(value)}`).join("\n");
}

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isContractDocument(value: unknown): value is ContractDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

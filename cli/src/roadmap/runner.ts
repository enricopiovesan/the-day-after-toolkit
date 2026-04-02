/*
 * Roadmap command runner.
 * This module connects report parsing, interactive prioritization, and roadmap
 * rendering so the CLI handler stays thin and testable.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

import inquirer from "inquirer";

import {
  ROADMAP_COMMAND_BASENAME,
  ROADMAP_COMMAND_COMPLETE_PREFIX,
  ROADMAP_COMMAND_HEADER_DESCRIPTION,
  ROADMAP_COMMAND_JSON_BASENAME,
  ROADMAP_COMMAND_NEXT_STEP,
  ROADMAP_COMMAND_OUTPUT_PREFIX,
  ROADMAP_COMMAND_PRIORITY_PREFIX,
  ROADMAP_CRITICALITY_PROMPT,
  ROADMAP_FREQUENCY_OPTION_LABELS,
  ROADMAP_FREQUENCY_PROMPT,
  ROADMAP_GENERATED_BY,
  ROADMAP_PROMPT_OPTION_LABELS
} from "./constants.js";
import { buildRoadmapMarkdown } from "./generator.js";
import { buildRoadmapCapabilities } from "./prioritizer.js";
import { loadRoadmapReport } from "./parser.js";
import type { RoadmapCapability, RoadmapCapabilityInput, RoadmapDocument } from "./types.js";
import { formatHeader, formatNextStep } from "../utils/logger.js";

export type RoadmapOutputFormat = "markdown" | "json";

export interface RoadmapCommandOptions {
  readonly inputPath: string;
  readonly outputPath: string;
  readonly format: RoadmapOutputFormat;
}

export interface RoadmapRunResult {
  readonly inputPath: string;
  readonly outputPath: string;
  readonly terminal: string;
  readonly content: string;
}

export interface RoadmapPromptAnswer {
  readonly businessCriticality: 1 | 2 | 3;
  readonly agentTouchpointFrequency: 1 | 2 | 3;
}

/* eslint-disable no-unused-vars */
export type RoadmapPromptRunner = (
  questions: readonly RoadmapPromptQuestion[]
) => Promise<RoadmapPromptAnswer>;
/* eslint-enable no-unused-vars */

interface RoadmapPromptQuestion {
  readonly type: "list";
  readonly name: keyof RoadmapPromptAnswer;
  readonly message: string;
  readonly choices: readonly { readonly name: string; readonly value: 1 | 2 | 3 }[];
}

export interface RoadmapRunnerDependencies {
  readonly prompt: RoadmapPromptRunner;
  readonly now: () => Date;
}

const DEFAULT_DEPENDENCIES: RoadmapRunnerDependencies = {
  prompt: async (questions) => inquirer.prompt(questions as never) as Promise<RoadmapPromptAnswer>,
  now: () => new Date()
};

export async function runRoadmapCommand(
  options: RoadmapCommandOptions,
  dependencies: Partial<RoadmapRunnerDependencies> = {}
): Promise<RoadmapRunResult> {
  const deps = { ...DEFAULT_DEPENDENCIES, ...dependencies };
  const report = await loadRoadmapReport(options.inputPath);
  const promptedCapabilities = await promptForCapabilities(report.capabilities, deps.prompt);
  const capabilities = buildRoadmapCapabilities(promptedCapabilities);
  const document = createRoadmapDocument(report, capabilities, deps.now());
  const outputPath = resolveRoadmapOutputPath(options.outputPath, options.format);
  const content = renderRoadmapOutput(document, options.format);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");

  return {
    inputPath: report.reportPath,
    outputPath,
    content,
    terminal: renderRoadmapTerminal(capabilities, outputPath)
  };
}

export function createRoadmapDocument(
  report: {
    readonly reportPath: string;
    readonly generatedAt: string;
    readonly reportScore: number;
    readonly summary: string;
    readonly capabilities: readonly RoadmapCapabilityInput[];
  },
  capabilities: readonly RoadmapCapability[],
  now: Date
): RoadmapDocument {
  return {
    generatedBy: ROADMAP_GENERATED_BY,
    generatedAt: now.toISOString(),
    sourceReport: report.reportPath,
    reportScore: report.reportScore,
    summary: report.summary,
    capabilities
  };
}

function renderRoadmapOutput(document: RoadmapDocument, format: RoadmapOutputFormat): string {
  if (format === "json") {
    return JSON.stringify(document, null, 2);
  }

  return buildRoadmapMarkdown(document);
}

function renderRoadmapTerminal(
  capabilities: readonly RoadmapCapability[],
  outputPath: string
): string {
  const priorityLines = capabilities.map((capability, index) =>
    `  ${index + 1}. ${capability.capability.padEnd(22)} score: ${capability.priorityScore}  ${describePriorityPhase(capability.phase)}`
  );

  return [
    formatHeader("roadmap", ROADMAP_COMMAND_HEADER_DESCRIPTION),
    "",
    `${ROADMAP_COMMAND_COMPLETE_PREFIX} ${capabilities.length} capabilities ranked.`,
    "",
    ROADMAP_COMMAND_PRIORITY_PREFIX,
    ...priorityLines,
    "",
    `${ROADMAP_COMMAND_OUTPUT_PREFIX} ${outputPath}`,
    "",
    formatNextStep(ROADMAP_COMMAND_NEXT_STEP)
  ].join("\n");
}

async function promptForCapabilities(
  capabilities: readonly RoadmapCapabilityInput[],
  prompt: RoadmapPromptRunner
): Promise<RoadmapCapabilityInput[]> {
  const rankedCapabilities: RoadmapCapabilityInput[] = [];

  for (const capability of capabilities) {
    const answers = await prompt([
      {
        type: "list",
        name: "businessCriticality",
        message: `${capability.capability}\nLegibility score: ${capability.legibilityScore} / 4\n\n${ROADMAP_CRITICALITY_PROMPT}`,
        choices: roadmapCriticalityChoices()
      },
      {
        type: "list",
        name: "agentTouchpointFrequency",
        message: `${capability.capability}\nLegibility score: ${capability.legibilityScore} / 4\n\n${ROADMAP_FREQUENCY_PROMPT}`,
        choices: roadmapFrequencyChoices()
      }
    ]);

    rankedCapabilities.push({
      ...capability,
      businessCriticality: answers.businessCriticality,
      agentTouchpointFrequency: answers.agentTouchpointFrequency
    });
  }

  return rankedCapabilities;
}

function roadmapCriticalityChoices(): readonly { readonly name: string; readonly value: 1 | 2 | 3 }[] {
  return [
    { name: ROADMAP_PROMPT_OPTION_LABELS[1], value: 1 },
    { name: ROADMAP_PROMPT_OPTION_LABELS[2], value: 2 },
    { name: ROADMAP_PROMPT_OPTION_LABELS[3], value: 3 }
  ] as const;
}

function roadmapFrequencyChoices(): readonly { readonly name: string; readonly value: 1 | 2 | 3 }[] {
  return [
    { name: ROADMAP_FREQUENCY_OPTION_LABELS[1], value: 1 },
    { name: ROADMAP_FREQUENCY_OPTION_LABELS[2], value: 2 },
    { name: ROADMAP_FREQUENCY_OPTION_LABELS[3], value: 3 }
  ] as const;
}

function resolveRoadmapOutputPath(outputPath: string, format: RoadmapOutputFormat): string {
  const resolved = resolve(outputPath);
  const isDirectoryTarget = resolved.endsWith("/") || extname(resolved).length === 0 && !outputPath.includes(".");

  if (isDirectoryTarget) {
    return join(resolved, format === "json" ? ROADMAP_COMMAND_JSON_BASENAME : ROADMAP_COMMAND_BASENAME);
  }

  if (format === "json" && resolved.endsWith(ROADMAP_COMMAND_BASENAME)) {
    return resolved.slice(0, -ROADMAP_COMMAND_BASENAME.length) + ROADMAP_COMMAND_JSON_BASENAME;
  }

  return resolved;
}

function describePriorityPhase(phase: RoadmapCapability["phase"]): string {
  if (phase === 1) {
    return "[extract first]";
  }

  if (phase === 2) {
    return "[extract second]";
  }

  if (phase === 3) {
    return "[extract third]";
  }

  return "[not current candidate]";
}

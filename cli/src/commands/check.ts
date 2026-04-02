/*
 * Implements cdad check.
 * This command turns the audit domain into a runnable repo baseline report
 * without pulling roadmap behavior into the same surface area.
 */

import inquirer from "inquirer";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import {
  DEFAULT_REPORT_OUTPUT,
  LEGIBILITY_ANSWER_LABELS
} from "../constants.js";
import {
  createCapabilityAssessment,
  createQuestionnaireSummary,
  createCheckReport,
  renderCheckReportJson,
  renderCheckReportMarkdown,
  renderCheckTerminalSummary,
  scanRepository,
  summarizeStaticScan
} from "../audit/index.js";
import { LEGIBILITY_QUESTIONS } from "../audit/questionnaire.js";

import type {
  CapabilityAnswerSet,
  CheckReport,
  LegibilityAnswer,
  QuestionnaireSummary,
} from "../audit/index.js";
import type { Command } from "commander";

type CheckOutputFormat = "markdown" | "json";

interface CheckCommandOptions {
  readonly output: string;
  readonly capabilities: string;
  readonly skipScan?: boolean;
  readonly skipQuestions?: boolean;
  readonly format?: CheckOutputFormat;
  readonly quiet?: boolean;
}

interface CheckCommandRuntime {
  readonly cwd: string;
  readonly now: () => Date;
  readonly prompt: CheckPromptRunner;
}

interface CheckCommandExecution {
  readonly report: CheckReport;
  readonly summary: string;
  readonly outputPath: string | null;
}

/* eslint-disable no-unused-vars */
type CheckPromptRunner = (
  questions: readonly CheckPromptQuestion[]
) => Promise<Record<string, unknown>>;
/* eslint-enable no-unused-vars */

interface CheckPromptQuestion {
  readonly type: "input" | "list";
  readonly name: string;
  readonly message: string;
  readonly choices?: readonly { readonly name: string; readonly value: LegibilityAnswer }[];
  readonly default?: string;
}

interface CapabilityNamePromptAnswer {
  readonly capabilityNames: string;
}

export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("Assess agent-readiness of the current repository")
    .option("--output <path>", "Output path for report", DEFAULT_REPORT_OUTPUT)
    .option("--capabilities <n>", "Number of capabilities to assess", "5")
    .option("--skip-scan", "Skip static analysis")
    .option("--skip-questions", "Skip interactive questionnaire")
    .option("--format <type>", "Output format: markdown | json", "markdown")
    .option("--quiet", "Terminal summary only")
    .action(async (options: CheckCommandOptions): Promise<void> => {
      try {
        await executeCheckCommand(options, {
          cwd: process.cwd(),
          now: () => new Date(),
          prompt: async (questions) => inquirer.prompt<Record<string, unknown>>(questions as never)
        });
      } catch (error) {
        console.error(formatCheckCommandError(error));
        process.exitCode = 1;
      }
    });
}

export async function executeCheckCommand(
  options: CheckCommandOptions,
  runtime: CheckCommandRuntime
): Promise<CheckCommandExecution> {
  const cwd = resolve(runtime.cwd);
  const outputPath = resolve(cwd, options.output ?? DEFAULT_REPORT_OUTPUT);
  const format = normalizeCheckOutputFormat(options.format);
  const capabilityLimit = parseCapabilityLimit(options.capabilities);
  const staticScan = options.skipScan ? summarizeStaticScan([]) : await scanRepository(cwd);
  const questionnaire = options.skipQuestions
    ? createQuestionnaireSummary([])
    : await buildQuestionnaireSummary(capabilityLimit, runtime.prompt);
  const report = createCheckReport({
    repo: basename(cwd),
    generatedAt: runtime.now().toISOString(),
    staticScan,
    questionnaire
  });

  if (!options.quiet) {
    const renderedReport =
      format === "json"
        ? renderCheckReportJson(report)
        : renderCheckReportMarkdown(report);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${renderedReport}\n`, "utf8");
  }

  const summary = buildTerminalSummary(report, options);

  console.log(summary);

  return {
    report,
    summary,
    outputPath: options.quiet ? null : outputPath
  };
}

async function buildQuestionnaireSummary(
  capabilityLimit: number,
  prompt: CheckPromptRunner
): Promise<QuestionnaireSummary> {
  const capabilityIds = await promptCapabilityNames(capabilityLimit, prompt);

  if (capabilityIds.length === 0) {
    return createQuestionnaireSummary([]);
  }

  const assessments = [] as CapabilityAnswerSet[];
  for (const capabilityId of capabilityIds) {
    const answers = await promptCapabilityAnswers(capabilityId, prompt);
    assessments.push(answers);
  }

  return createQuestionnaireSummary(
    capabilityIds.map((capabilityId, index) => {
      const assessment = assessments[index];

      if (!assessment) {
        throw new Error(`Missing questionnaire answers for capability ${capabilityId}.`);
      }

      return createCapabilityAssessment(capabilityId, assessment);
    })
  );
}

async function promptCapabilityNames(
  capabilityLimit: number,
  prompt: CheckPromptRunner
): Promise<string[]> {
  const response = await prompt([
    {
      type: "input",
      name: "capabilityNames",
      message: `Enter up to ${capabilityLimit} business-critical capabilities (comma-separated):`
    }
  ]) as unknown as CapabilityNamePromptAnswer;

  const capabilityIds = response.capabilityNames
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (capabilityIds.length > capabilityLimit) {
    throw new RangeError(
      `You entered ${capabilityIds.length} capabilities, but --capabilities allows only ${capabilityLimit}.`
    );
  }

  return capabilityIds;
}

async function promptCapabilityAnswers(
  capabilityId: string,
  prompt: CheckPromptRunner
): Promise<CapabilityAnswerSet> {
  const responses = await prompt(
    LEGIBILITY_QUESTIONS.map((question) => ({
      type: "list",
      name: `${capabilityId}.${question.key}`,
      message: `${capabilityId}: ${question.prompt}`,
      choices: [
        { name: LEGIBILITY_ANSWER_LABELS.yes, value: "yes" },
        { name: LEGIBILITY_ANSWER_LABELS.partially, value: "partially" },
        { name: LEGIBILITY_ANSWER_LABELS.no, value: "no" }
      ]
    }))
  );

  return {
    businessRules: requireLegibilityAnswer(responses, `${capabilityId}.businessRules`),
    constraintHistory: requireLegibilityAnswer(responses, `${capabilityId}.constraintHistory`),
    dependencyRationale: requireLegibilityAnswer(responses, `${capabilityId}.dependencyRationale`),
    exceptionLogic: requireLegibilityAnswer(responses, `${capabilityId}.exceptionLogic`)
  };
}

function normalizeCheckOutputFormat(format: CheckCommandOptions["format"]): CheckOutputFormat {
  if (format === "json") {
    return "json";
  }

  return "markdown";
}

function parseCapabilityLimit(rawValue: string): number {
  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
    throw new RangeError(`--capabilities must be an integer between 1 and 10. Received ${rawValue}.`);
  }

  return parsed;
}

function buildTerminalSummary(report: CheckReport, options: CheckCommandOptions): string {
  const outputLabel = options.output ?? DEFAULT_REPORT_OUTPUT;
  const summary = renderCheckTerminalSummary(report).replace(DEFAULT_REPORT_OUTPUT, outputLabel);

  if (!options.quiet) {
    return summary;
  }

  return summary
    .split("\n")
    .filter((line) => line.trim() !== `Full report saved to: ${outputLabel}`)
    .filter((line, index, lines) => !(line.trim().length === 0 && lines[index - 1]?.trim().length === 0))
    .join("\n");
}

function requireLegibilityAnswer(
  responses: Record<string, unknown>,
  key: string
): LegibilityAnswer {
  const value = responses[key];

  if (value === "yes" || value === "partially" || value === "no") {
    return value;
  }

  throw new Error(`Missing questionnaire answer for ${key}.`);
}

function formatCheckCommandError(error: unknown): string {
  if (error instanceof Error) {
    return `cdad check failed: ${error.message}`;
  }

  return "cdad check failed: unknown error";
}

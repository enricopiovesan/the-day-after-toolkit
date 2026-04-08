/*
 * Implements cdad roadmap.
 */

import type { RoadmapCommandOptions, RoadmapRunResult, RoadmapRunnerDependencies } from "../roadmap/runner.js";
import type { Command } from "commander";

import { runRoadmapCommand } from "../roadmap/runner.js";

interface RoadmapCliOptions {
  readonly input: string;
  readonly output: string;
  readonly format: "markdown" | "json";
}

export interface RoadmapCommandExecution {
  readonly result: RoadmapRunResult;
  readonly output: string;
}

export function registerRoadmapCommand(program: Command): void {
  program
    .command("roadmap")
    .description("Generate a prioritized transformation roadmap from a report")
    .option("--input <path>", "Input report path", "cdad-report.md")
    .option("--output <path>", "Output roadmap path", "cdad-roadmap.md")
    .option("--format <type>", "Output format: markdown | json", "markdown")
    .action(async (options: RoadmapCliOptions): Promise<void> => {
      try {
        const execution = await executeRoadmapCommand(options);

        console.log(execution.output);
      } catch (error) {
        console.error(formatRoadmapCommandError(error));
        process.exitCode = 1;
      }
    });
}

export async function executeRoadmapCommand(
  options: RoadmapCliOptions,
  dependencies: Partial<RoadmapRunnerDependencies> = {}
): Promise<RoadmapCommandExecution> {
  const result = await runRoadmapCommand(
    {
      inputPath: options.input,
      outputPath: options.output,
      format: normalizeRoadmapFormat(options.format)
    },
    dependencies
  );

  return {
    result,
    output: result.terminal
  };
}

function normalizeRoadmapFormat(format: RoadmapCommandOptions["format"]): RoadmapCommandOptions["format"] {
  return format === "json" ? "json" : "markdown";
}

function formatRoadmapCommandError(error: unknown): string {
  if (error instanceof Error) {
    return `cdad roadmap failed: ${error.message}`;
  }

  return "cdad roadmap failed: unknown error";
}

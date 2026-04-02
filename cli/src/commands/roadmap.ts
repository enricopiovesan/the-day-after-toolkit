/*
 * Implements cdad roadmap.
 */

import type { Command } from "commander";

import { runRoadmapCommand } from "../roadmap/runner.js";

export function registerRoadmapCommand(program: Command): void {
  program
    .command("roadmap")
    .description("Generate a prioritized transformation roadmap from a report")
    .option("--input <path>", "Input report path", "cdad-report.md")
    .option("--output <path>", "Output roadmap path", "cdad-roadmap.md")
    .option("--format <type>", "Output format: markdown | json", "markdown")
    .action(async (options: { input: string; output: string; format: "markdown" | "json" }): Promise<void> => {
      try {
        const format = options.format === "json" ? "json" : "markdown";
        const result = await runRoadmapCommand({
          inputPath: options.input,
          outputPath: options.output,
          format
        });

        console.log(result.terminal);
      } catch (error) {
        console.error(formatRoadmapCommandError(error));
        process.exitCode = 1;
      }
    });
}

function formatRoadmapCommandError(error: unknown): string {
  if (error instanceof Error) {
    return `cdad roadmap failed: ${error.message}`;
  }

  return "cdad roadmap failed: unknown error";
}

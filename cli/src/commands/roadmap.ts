/*
 * Implements cdad roadmap.
 */

import type { Command } from "commander";

export function registerRoadmapCommand(program: Command): void {
  program
    .command("roadmap")
    .description("Generate a prioritized transformation roadmap from a report")
    .option("--input <path>", "Input report path", "cdad-report.md")
    .option("--output <path>", "Output roadmap path", "cdad-roadmap.md")
    .option("--format <type>", "Output format: markdown | json", "markdown")
    .action(async (): Promise<void> => {
      throw new Error("cdad roadmap is not implemented yet.");
    });
}

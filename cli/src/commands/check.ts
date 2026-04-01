/*
 * Implements cdad check.
 * This file currently wires the command shape from the spec; the scoring and
 * report behavior will be filled in against the authoritative spec sections.
 */

import type { Command } from "commander";

export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("Assess agent-readiness of the current repository")
    .option("--output <path>", "Output path for report", "cdad-report.md")
    .option("--capabilities <n>", "Number of capabilities to assess", "5")
    .option("--skip-scan", "Skip static analysis")
    .option("--skip-questions", "Skip interactive questionnaire")
    .option("--format <type>", "Output format: markdown | json", "markdown")
    .option("--quiet", "Terminal summary only")
    .action(async (): Promise<void> => {
      throw new Error("cdad check is not implemented yet.");
    });
}

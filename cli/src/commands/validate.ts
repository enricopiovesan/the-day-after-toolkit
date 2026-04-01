/*
 * Implements cdad validate.
 */

import type { Command } from "commander";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .argument("[path]", "Path to a contract or directory")
    .description("Validate contract files and related generated artifacts")
    .option("--all", "Validate all contract files in the repo")
    .option("--strict", "Treat warnings as errors")
    .option("--format <type>", "Output format: text | json", "text")
    .option("--fix", "Attempt to auto-fix warnings")
    .option("--install-hook", "Install a pre-commit hook for validation")
    .action(async (): Promise<void> => {
      throw new Error("cdad validate is not implemented yet.");
    });
}

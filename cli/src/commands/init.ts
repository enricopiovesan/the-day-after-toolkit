/*
 * Implements cdad init.
 */

import type { Command } from "commander";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .argument("<capability-id>", "Capability id in domain/subdomain/action form")
    .description("Scaffold a capability contract triple")
    .option("--extended", "Use the extended contract template")
    .option("--no-prompts", "Skip interactive prompts")
    .option("--output <dir>", "Output directory", "cdad")
    .action(async (): Promise<void> => {
      throw new Error("cdad init is not implemented yet.");
    });
}

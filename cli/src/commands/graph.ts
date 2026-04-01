/*
 * Implements cdad graph.
 */

import type { Command } from "commander";

export function registerGraphCommand(program: Command): void {
  program
    .command("graph")
    .argument("[scope]", "Optional directory or scope")
    .description("Render the capability dependency graph")
    .option("--capability <id>", "Render a subgraph for one capability")
    .option("--domain <name>", "Scope graph to a single domain")
    .option("--state <state>", "Filter by state")
    .option("--output <dir>", "Output directory", ".")
    .option("--no-mermaid", "Skip Mermaid output")
    .option("--no-json", "Skip JSON output")
    .action(async (): Promise<void> => {
      throw new Error("cdad graph is not implemented yet.");
    });
}

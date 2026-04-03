/*
 * Implements cdad graph.
 */

import {
  parseCapabilityGraph,
  type GraphContractState,
  type ParseCapabilityGraphRuntime
} from "../graph/parser.js";
import {
  renderCapabilityGraph,
  renderGraphTerminalSummary,
  type RenderCapabilityGraphResult
} from "../graph/renderer.js";

import type { Command } from "commander";

interface GraphCommandOptions {
  readonly capability?: string;
  readonly domain?: string;
  readonly state?: string;
  readonly output?: string;
  readonly mermaid?: boolean;
  readonly json?: boolean;
}

export interface GraphCommandExecution {
  readonly output: string;
  readonly renderResult: RenderCapabilityGraphResult;
}

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
    .action(async (scope: string | undefined, options: GraphCommandOptions): Promise<void> => {
      try {
        const execution = await executeGraphCommand(scope, options, {
          cwd: process.cwd(),
          now: () => new Date()
        });

        console.log(execution.output);
      } catch (error) {
        console.error(formatGraphCommandError(error));
        process.exitCode = 1;
      }
    });
}

export async function executeGraphCommand(
  scope: string | undefined,
  options: GraphCommandOptions,
  runtime: ParseCapabilityGraphRuntime & { readonly now: () => Date }
): Promise<GraphCommandExecution> {
  const graph = await parseCapabilityGraph(
    {
      scope,
      capability: options.capability,
      domain: options.domain,
      state: normalizeGraphState(options.state)
    },
    runtime
  );

  const renderResult = await renderCapabilityGraph(
    graph,
    {
      outputDir: options.output,
      includeMermaid: options.mermaid,
      includeJson: options.json
    },
    runtime.now()
  );

  return {
    renderResult,
    output: renderGraphTerminalSummary({
      graph,
      markdownPath: renderResult.markdownPath,
      mermaidPath: renderResult.mermaidPath,
      jsonPath: renderResult.jsonPath
    })
  };
}

function normalizeGraphState(state: string | undefined): GraphContractState | undefined {
  if (!state) {
    return undefined;
  }

  if (state === "active" || state === "draft" || state === "deprecated" || state === "retired") {
    return state;
  }

  throw new Error(`Unsupported state filter: ${state}`);
}

function formatGraphCommandError(error: unknown): string {
  if (error instanceof Error) {
    return `cdad graph failed: ${error.message}`;
  }

  return "cdad graph failed: unknown error";
}

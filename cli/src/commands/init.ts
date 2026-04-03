/*
 * Implements cdad init.
 */

import inquirer from "inquirer";

import {
  scaffoldContract,
  type InitPromptAnswerMap,
  type InitPromptQuestion,
  type InitRuntime,
  type ScaffoldContractResult
} from "../contracts/scaffolder.js";

import type { Command } from "commander";

interface InitCommandOptions {
  readonly extended?: boolean;
  readonly noPrompts?: boolean;
  readonly output?: string;
}

interface InitCliOptions {
  readonly extended?: boolean;
  readonly prompts?: boolean;
  readonly output?: string;
}

export interface InitCommandExecution {
  readonly result: ScaffoldContractResult;
  readonly output: string;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .argument("<capability-id>", "Capability id in domain/subdomain/action form")
    .description("Scaffold a capability contract triple")
    .option("--extended", "Use the extended contract template")
    .option("--no-prompts", "Skip interactive prompts")
    .option("--output <dir>", "Output directory", "cdad")
    .action(async (capabilityId: string, options: InitCliOptions): Promise<void> => {
      try {
        const execution = await executeInitCommand(capabilityId, {
          extended: options.extended,
          noPrompts: options.prompts === false,
          output: options.output
        }, {
          cwd: process.cwd(),
          now: () => new Date(),
          prompt: async (questions) => runInquirerPrompts(questions)
        });

        console.log(execution.output);
      } catch (error) {
        console.error(formatInitCommandError(error));
        process.exitCode = 1;
      }
    });
}

export async function executeInitCommand(
  capabilityId: string,
  options: InitCommandOptions,
  runtime: InitRuntime
): Promise<InitCommandExecution> {
  const result = await scaffoldContract(
    {
      capabilityId,
      outputDir: options.output,
      extended: options.extended,
      noPrompts: options.noPrompts
    },
    runtime
  );

  return {
    result,
    output: [
      `Scaffolding complete for ${capabilityId}.`,
      "",
      "Files created:",
      `  ${result.yamlPath}`,
      `  ${result.jsonPath}  [auto-generated from YAML]`,
      `  ${result.markdownPath}  [auto-generated from YAML]`,
      "",
      `Next: fill in ${result.yamlPath}`,
      `Then run: cdad validate ${result.yamlPath}`
    ].join("\n")
  };
}

async function runInquirerPrompts(
  questions: readonly InitPromptQuestion[]
): Promise<InitPromptAnswerMap> {
  return inquirer.prompt<InitPromptAnswerMap>(questions as never);
}

function formatInitCommandError(error: unknown): string {
  if (error instanceof Error) {
    return `cdad init failed: ${error.message}`;
  }

  return "cdad init failed: unknown error";
}

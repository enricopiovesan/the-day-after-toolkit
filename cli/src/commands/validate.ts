/*
 * Implements cdad validate.
 * The command layer stays thin and delegates validation behavior to the
 * contract validator so the rules remain testable in isolation.
 */

import type { Command } from "commander";

import {
  VALIDATE_COMMAND_DESCRIPTION,
  VALIDATE_DEFAULT_FORMAT,
  VALIDATE_COMMAND_NAME,
  VALIDATE_GENERATED_BY
} from "../contracts/constants.js";
import type {
  ValidateCommandOptions,
  ValidateRuntime,
  ValidationReport
} from "../contracts/types.js";
import {
  renderValidationReportJson,
  renderValidationReportText,
  validateContracts
} from "../contracts/validator.js";

export interface ValidateCommandExecution {
  readonly report: ValidationReport;
  readonly output: string;
}

export function registerValidateCommand(program: Command): void {
  program
    .command(VALIDATE_COMMAND_NAME)
    .argument("[path]", "Path to a contract or directory")
    .description(VALIDATE_COMMAND_DESCRIPTION)
    .option("--all", "Validate all contract files in the repo")
    .option("--strict", "Treat warnings as errors")
    .option("--format <type>", "Output format: text | json", VALIDATE_DEFAULT_FORMAT)
    .option("--fix", "Attempt to auto-fix warnings")
    .option("--install-hook", "Install a pre-commit hook for validation")
    .action(async (path: string | undefined, options: ValidateCommandOptions): Promise<void> => {
      try {
        const execution = await executeValidateCommand(
          {
            ...options,
            path
          },
          {
            cwd: process.cwd()
          }
        );

        console.log(execution.output);
        process.exitCode = execution.report.exitCode;
      } catch (error) {
        console.error(formatValidateCommandError(error));
        process.exitCode = 1;
      }
    });
}

export async function executeValidateCommand(
  options: ValidateCommandOptions,
  runtime: ValidateRuntime
): Promise<ValidateCommandExecution> {
  const report = await validateContracts(options, runtime);
  const output =
    report.format === "json"
      ? renderValidationReportJson(report)
      : renderValidationReportText(report);

  return { report, output };
}

function formatValidateCommandError(error: unknown): string {
  if (error instanceof Error) {
    return `${VALIDATE_GENERATED_BY} failed: ${error.message}`;
  }

  return `${VALIDATE_GENERATED_BY} failed: unknown error`;
}

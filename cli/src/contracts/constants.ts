/*
 * Validate-specific constants and user-facing copy.
 * Keeping these together makes the validator command and its tests stay aligned.
 */

export const VALIDATE_COMMAND_NAME = "validate";
export const VALIDATE_GENERATED_BY = "cdad validate";
export const VALIDATE_COMMAND_DESCRIPTION = "Validate contract files and related generated artifacts";
export const VALIDATE_DEFAULT_FORMAT = "text";
export const VALIDATE_DEFAULT_PATH = ".";
export const VALIDATE_REPORT_TITLE = "Contract Validation Report";
export const VALIDATE_NEXT_STEP = "Fix the issues above, then run `cdad validate` again.";
export const VALIDATE_ALL_CONTRACT_GLOB = "**/contract.{yaml,yml,json}";
export const VALIDATE_HOOK_PATH = ".git/hooks/pre-commit";
export const VALIDATE_HOOK_SCRIPT = `#!/bin/sh
set -eu

cd "$(git rev-parse --show-toplevel)"
cdad validate --all --strict
`;

export const VALIDATE_DESCRIPTION_PATTERN_TERMS = [
  "retry",
  "backoff",
  "exponential",
  "timeout",
  "polling",
  "cache",
  "queue"
] as const;

export const VALIDATE_TEXT_LABELS = {
  passed: "passed",
  failed: "failed",
  warning: "warning",
  error: "error"
} as const;

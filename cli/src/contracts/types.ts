/*
 * Shared types for contract validation and reporting.
 * These types keep the validator, command handler, and tests aligned.
 */

export type ValidationSeverity = "error" | "warning";
export type ValidationOutputFormat = "text" | "json";
export type ContractSchemaKind = "minimum" | "extended";

export interface ValidateCommandOptions {
  readonly path?: string;
  readonly all?: boolean;
  readonly strict?: boolean;
  readonly format?: ValidationOutputFormat;
  readonly fix?: boolean;
  readonly installHook?: boolean;
}

export interface ValidateRuntime {
  readonly cwd: string;
}

export interface ValidationIssue {
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly filePath: string;
  readonly message: string;
  readonly field?: string;
}

export interface FileValidationResult {
  readonly filePath: string;
  readonly schemaKind: ContractSchemaKind;
  readonly contractId: string | null;
  readonly issues: readonly ValidationIssue[];
}

export interface ValidationTotals {
  readonly files: number;
  readonly errors: number;
  readonly warnings: number;
}

export interface ValidationReport {
  readonly generatedBy: string;
  readonly generatedAt: string;
  readonly cwd: string;
  readonly strict: boolean;
  readonly format: ValidationOutputFormat;
  readonly files: readonly FileValidationResult[];
  readonly totals: ValidationTotals;
  readonly exitCode: 0 | 2;
  readonly hookInstalled?: boolean;
}

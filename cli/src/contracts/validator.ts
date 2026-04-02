/*
 * Contract validator for cdad validate.
 * This module keeps file discovery, schema validation, versioning checks,
 * dependency consistency checks, anti-pattern warnings, and hook installation
 * in one place so the command layer stays thin.
 */

import Ajv2020Module from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import { glob } from "glob";
import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load as loadYaml } from "js-yaml";

import { CONTRACT_SCHEMA_FILES } from "./schema.js";
import {
  VALIDATE_ALL_CONTRACT_GLOB,
  VALIDATE_DEFAULT_PATH,
  VALIDATE_DESCRIPTION_PATTERN_TERMS,
  VALIDATE_GENERATED_BY,
  VALIDATE_HOOK_PATH,
  VALIDATE_HOOK_SCRIPT,
  VALIDATE_NEXT_STEP,
  VALIDATE_REPORT_TITLE
} from "./constants.js";
import type {
  ContractSchemaKind,
  FileValidationResult,
  ValidateCommandOptions,
  ValidateRuntime,
  ValidationIssue,
  ValidationOutputFormat,
  ValidationReport,
  ValidationTotals
} from "./types.js";
import { pathExists } from "../utils/file.js";

/* eslint-disable no-unused-vars */
interface CompiledSchemaValidator {
  (data: unknown): boolean;
  errors?: readonly ErrorObject[] | null;
}
/* eslint-enable no-unused-vars */

interface ContractDocument extends Record<string, unknown> {
  readonly id?: unknown;
  readonly version?: unknown;
  readonly owner?: unknown;
  readonly state?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
  readonly inputs?: unknown;
  readonly outputs?: unknown;
  readonly non_goals?: unknown;
  readonly use_cases?: unknown;
  readonly open_questions?: unknown;
  readonly dependencies?: unknown;
  readonly performance?: unknown;
  readonly error_handling?: unknown;
  readonly trust_zone?: unknown;
  readonly rate_limits?: unknown;
  readonly inherited_constraints?: unknown;
  readonly constraint_history?: unknown;
  readonly deprecation_timeline?: unknown;
  readonly migration_path?: unknown;
  readonly versioning_strategy?: unknown;
  readonly version_history?: unknown;
}

interface ValidatedContractFile extends FileValidationResult {
  readonly dependencyIds: readonly string[];
}

const TOOLKIT_ROOT = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const Ajv2020 = Ajv2020Module as unknown as typeof import("ajv").default;
const SCHEMA_VALIDATOR = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const SCHEMA_CACHE = new Map<string, object>();
const VALIDATOR_CACHE = new Map<ContractSchemaKind, CompiledSchemaValidator>();
const EXTENDED_MARKER_KEYS = new Set<string>([
  "dependencies",
  "performance",
  "error_handling",
  "trust_zone",
  "rate_limits",
  "constraint_history",
  "version_history",
  "versioning_strategy",
  "migration_path",
  "deprecation_timeline",
  "inherited_constraints"
]);
const CONTRACT_SCHEMA_PATHS: Record<ContractSchemaKind, string> = {
  minimum: join(TOOLKIT_ROOT, CONTRACT_SCHEMA_FILES.minimumViable),
  extended: join(TOOLKIT_ROOT, CONTRACT_SCHEMA_FILES.extended)
};
const IGNORED_GLOB_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**"
] as const;

export async function validateContracts(
  options: ValidateCommandOptions,
  runtime: ValidateRuntime = { cwd: process.cwd() }
): Promise<ValidationReport> {
  const cwd = resolve(runtime.cwd);
  const strict = options.strict ?? false;
  const format = normalizeValidationFormat(options.format);

  if (options.installHook) {
    return installValidateHook(cwd, format);
  }

  const repoRoot = await findRepoRoot(cwd);
  const targets = await resolveValidationTargets(repoRoot, cwd, options);

  if (targets.length === 0) {
    throw new Error(`No contract files were found under ${repoRoot}.`);
  }

  const validatedFiles: ValidatedContractFile[] = [];
  for (const filePath of targets) {
    validatedFiles.push(await validateContractFile(filePath));
  }

  const graph = buildDependencyGraph(validatedFiles);
  const extraIssues = [
    ...findDuplicateContractIdIssues(validatedFiles),
    ...findMissingDependencyIssues(validatedFiles, graph.contractIds),
    ...findDependencyCycleIssues(graph.adjacency, validatedFiles)
  ];
  const reportFiles = mergeAdditionalIssues(validatedFiles, extraIssues);
  const totals = computeTotals(reportFiles);

  return {
    generatedBy: VALIDATE_GENERATED_BY,
    generatedAt: new Date().toISOString(),
    cwd,
    strict,
    format,
    files: reportFiles,
    totals,
    exitCode: totals.errors > 0 || (strict && totals.warnings > 0) ? 2 : 0
  };
}

export async function installValidateHook(
  cwd: string,
  format: ValidationOutputFormat = "text"
): Promise<ValidationReport> {
  const repoRoot = await findRepoRoot(cwd);
  const hookPath = resolve(repoRoot, VALIDATE_HOOK_PATH);

  await mkdir(dirname(hookPath), { recursive: true });

  if (await pathExists(hookPath)) {
    const existing = await readFile(hookPath, "utf8");
    if (existing === VALIDATE_HOOK_SCRIPT) {
      return createHookReport(repoRoot, format);
    }

    throw new Error(
      `A pre-commit hook already exists at ${hookPath}. Merge the cdad validate hook manually to avoid overwriting existing logic.`
    );
  }

  await writeFile(hookPath, VALIDATE_HOOK_SCRIPT, "utf8");
  await chmod(hookPath, 0o755);

  return createHookReport(repoRoot, format);
}

export function renderValidationReportText(report: ValidationReport): string {
  const header = `${VALIDATE_GENERATED_BY} — ${VALIDATE_REPORT_TITLE}`;
  const separator = "─".repeat(header.length);

  if (report.hookInstalled) {
    return [
      header,
      separator,
      "",
      `Pre-commit hook installed at ${VALIDATE_HOOK_PATH}.`,
      "",
      "Next step: run `cdad validate --all --strict` before committing."
    ].join("\n");
  }

  const issues = collectIssues(report.files);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const summary = [
    header,
    separator,
    "",
    `Files validated: ${report.totals.files}`,
    `Errors: ${report.totals.errors}`,
    `Warnings: ${report.totals.warnings}`,
    `Strict mode: ${report.strict ? "on" : "off"}`
  ];

  const issueSections = [
    ...renderIssueSection("Errors", errors),
    ...(errors.length > 0 && warnings.length > 0 ? [""] : []),
    ...renderIssueSection("Warnings", warnings)
  ];

  const hasIssues = errors.length > 0 || warnings.length > 0;
  const nextStep = hasIssues
    ? VALIDATE_NEXT_STEP
    : "Next step: commit the validated contract.";

  return [
    ...summary,
    "",
    ...(hasIssues ? issueSections : ["No validation issues found."]),
    "",
    nextStep
  ].join("\n");
}

export function renderValidationReportJson(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}

async function validateContractFile(filePath: string): Promise<ValidatedContractFile> {
  const raw = await readFile(filePath, "utf8");
  const parsed = parseContractDocument(raw, filePath);

  if (!parsed) {
    return {
      filePath,
      schemaKind: "minimum",
      contractId: null,
      dependencyIds: [],
      issues: [
        {
          code: "schema",
          severity: "error",
          filePath,
          message: "Contract document could not be parsed as YAML or JSON."
        }
      ]
    };
  }

  const schemaKind = inferSchemaKind(parsed, filePath);
  const contractId = readStringProperty(parsed, "id");
  const dependencyIds = extractDependencyIds(parsed);

  return {
    filePath,
    schemaKind,
    contractId,
    dependencyIds,
    issues: [
      ...validateSchema(parsed, schemaKind, filePath),
      ...validateVersioningRules(parsed, schemaKind, filePath),
      ...validateAntiPatterns(parsed, filePath)
    ]
  };
}

async function resolveValidationTargets(
  repoRoot: string,
  cwd: string,
  options: ValidateCommandOptions
): Promise<string[]> {
  if (options.all) {
    return discoverContractFiles(repoRoot);
  }

  const pathInput = resolve(cwd, options.path ?? VALIDATE_DEFAULT_PATH);
  const fileStat = await stat(pathInput).catch(() => null);

  if (fileStat?.isDirectory()) {
    return discoverContractFiles(pathInput);
  }

  if (fileStat?.isFile()) {
    return [pathInput];
  }

  throw new Error(`Contract path not found: ${pathInput}`);
}

async function discoverContractFiles(rootDir: string): Promise<string[]> {
  const matches = await glob(VALIDATE_ALL_CONTRACT_GLOB, {
    cwd: rootDir,
    absolute: true,
    nodir: true,
    ignore: [...IGNORED_GLOB_PATTERNS]
  });

  return [...new Set(matches)].sort();
}

async function findRepoRoot(startDir: string): Promise<string> {
  let current = resolve(startDir);

  while (true) {
    if (await isRepoRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return resolve(startDir);
    }

    current = parent;
  }
}

async function isRepoRoot(candidate: string): Promise<boolean> {
  const packagePath = join(candidate, "package.json");
  if (!(await pathExists(packagePath))) {
    return false;
  }

  try {
    const source = await readFile(packagePath, "utf8");
    const parsed = JSON.parse(source) as { readonly name?: unknown };
    return parsed.name === "cdad";
  } catch {
    return false;
  }
}

function createHookReport(cwd: string, format: ValidationOutputFormat): ValidationReport {
  return {
    generatedBy: VALIDATE_GENERATED_BY,
    generatedAt: new Date().toISOString(),
    cwd,
    strict: false,
    format,
    files: [],
    totals: { files: 0, errors: 0, warnings: 0 },
    exitCode: 0,
    hookInstalled: true
  };
}

function parseContractDocument(raw: string, filePath: string): ContractDocument | null {
  try {
    if (extname(filePath).toLowerCase() === ".json") {
      const parsed = JSON.parse(raw) as unknown;
      return isContractDocument(parsed) ? parsed : null;
    }

    const parsed = loadYaml(raw) as unknown;
    return isContractDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function inferSchemaKind(contract: ContractDocument, filePath: string): ContractSchemaKind {
  if (filePath.includes("extended-contract") || filePath.includes("-extended")) {
    return "extended";
  }

  if (Object.keys(contract).some((key) => EXTENDED_MARKER_KEYS.has(key))) {
    return "extended";
  }

  return "minimum";
}

function validateSchema(
  contract: ContractDocument,
  schemaKind: ContractSchemaKind,
  filePath: string
): ValidationIssue[] {
  const validator = getSchemaValidator(schemaKind);
  const valid = validator(contract);

  if (valid) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  for (const error of validator.errors ?? []) {
    issues.push({
      code: "schema",
      severity: "error",
      filePath,
      field: schemaErrorField(error),
      message: formatSchemaError(error)
    });
  }

  return issues;
}

function validateVersioningRules(
  contract: ContractDocument,
  schemaKind: ContractSchemaKind,
  filePath: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const state = readStringProperty(contract, "state");

  if (state === "active") {
    const openQuestions = readStringArray(contract, "open_questions");
    if (openQuestions && openQuestions.length > 0) {
      issues.push({
        code: "versioning",
        severity: "error",
        filePath,
        field: "open_questions",
        message: "Active contracts must keep open_questions empty."
      });
    }
  }

  if (state === "deprecated" && schemaKind === "extended") {
    const migrationPath = readStringProperty(contract, "migration_path");
    if (!migrationPath) {
      issues.push({
        code: "versioning",
        severity: "error",
        filePath,
        field: "migration_path",
        message: "Deprecated contracts must declare migration_path."
      });
    }
  }

  if (schemaKind === "extended") {
    // The spec’s version-history rule depends on the extended contract surface,
    // so we only enforce it when that surface is present.
    const version = readStringProperty(contract, "version");
    const majorVersion = parseMajorVersion(version);
    if (majorVersion !== null && majorVersion > 0) {
      const versionHistory = readArray(contract, "version_history");
      if (!versionHistory || versionHistory.length === 0) {
        issues.push({
          code: "versioning",
          severity: "error",
          filePath,
          field: "version_history",
          message: `Version ${version} must include a version_history entry that explains the breaking change.`
        });
      }
    }
  }

  return issues;
}

function validateAntiPatterns(contract: ContractDocument, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const description = readStringProperty(contract, "description");

  if (description) {
    const matchedTerms = VALIDATE_DESCRIPTION_PATTERN_TERMS.filter((term) =>
      new RegExp(`\\b${term}\\b`, "i").test(description)
    );

    if (matchedTerms.length > 0) {
      issues.push({
        code: "anti-pattern",
        severity: "warning",
        filePath,
        field: "description",
        message: `Description uses implementation language (${matchedTerms.join(", ")}). Write the business intent or constraint instead.`
      });
    }
  }

  const nonGoals = readArray(contract, "non_goals");
  if (nonGoals && nonGoals.length === 0) {
    issues.push({
      code: "anti-pattern",
      severity: "warning",
      filePath,
      field: "non_goals",
      message: "Add at least one non-goal so the contract has a clear boundary."
    });
  }

  return issues;
}

function buildDependencyGraph(files: readonly ValidatedContractFile[]): {
  readonly contractIds: Map<string, string>;
  readonly adjacency: Map<string, readonly string[]>;
} {
  const contractIds = new Map<string, string>();
  const adjacency = new Map<string, readonly string[]>();

  for (const file of files) {
    if (!file.contractId) {
      continue;
    }

    if (!contractIds.has(file.contractId)) {
      contractIds.set(file.contractId, file.filePath);
    }

    adjacency.set(file.contractId, file.dependencyIds);
  }

  return { contractIds, adjacency };
}

function findDuplicateContractIdIssues(
  files: readonly ValidatedContractFile[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    if (!file.contractId) {
      continue;
    }

    const firstFile = seen.get(file.contractId);
    if (!firstFile) {
      seen.set(file.contractId, file.filePath);
      continue;
    }

    if (firstFile !== file.filePath) {
      issues.push({
        code: "dependency",
        severity: "error",
        filePath: file.filePath,
        field: "id",
        message: `Duplicate contract id ${file.contractId} already exists in ${firstFile}.`
      });
    }
  }

  return issues;
}

function findMissingDependencyIssues(
  files: readonly ValidatedContractFile[],
  contractIds: Map<string, string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const file of files) {
    if (!file.contractId) {
      continue;
    }

    for (const dependencyId of file.dependencyIds) {
      if (!contractIds.has(dependencyId)) {
        issues.push({
          code: "dependency",
          severity: "error",
          filePath: file.filePath,
          field: "dependencies",
          message: `Dependency ${dependencyId} is not defined in the current validation set.`
        });
      }
    }
  }

  return issues;
}

function findDependencyCycleIssues(
  adjacency: Map<string, readonly string[]>,
  files: readonly ValidatedContractFile[]
): ValidationIssue[] {
  const fileById = new Map<string, string>();
  for (const file of files) {
    if (file.contractId && !fileById.has(file.contractId)) {
      fileById.set(file.contractId, file.filePath);
    }
  }

  const issues: ValidationIssue[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const reported = new Set<string>();

  const visit = (id: string): void => {
    if (visiting.has(id)) {
      const startIndex = stack.indexOf(id);
      const cycle = startIndex >= 0 ? [...stack.slice(startIndex), id] : [...stack, id];
      const signature = cycle.join(" -> ");

      if (!reported.has(signature)) {
        reported.add(signature);
        issues.push({
          code: "dependency",
          severity: "error",
          filePath: fileById.get(id) ?? id,
          field: "dependencies",
          message: `Circular dependency detected: ${signature}.`
        });
      }

      return;
    }

    if (visited.has(id)) {
      return;
    }

    visiting.add(id);
    stack.push(id);

    for (const dependencyId of adjacency.get(id) ?? []) {
      if (adjacency.has(dependencyId)) {
        visit(dependencyId);
      }
    }

    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of adjacency.keys()) {
    visit(id);
  }

  return issues;
}

function mergeAdditionalIssues(
  files: readonly ValidatedContractFile[],
  extraIssues: readonly ValidationIssue[]
): FileValidationResult[] {
  if (extraIssues.length === 0) {
    return files.map(stripInternalValidationData);
  }

  const issuesByFile = new Map<string, ValidationIssue[]>();
  for (const issue of extraIssues) {
    const bucket = issuesByFile.get(issue.filePath) ?? [];
    bucket.push(issue);
    issuesByFile.set(issue.filePath, bucket);
  }

  return files.map((file) => ({
    ...stripInternalValidationData(file),
    issues: [...file.issues, ...(issuesByFile.get(file.filePath) ?? [])]
  }));
}

function stripInternalValidationData(file: ValidatedContractFile): FileValidationResult {
  return {
    filePath: file.filePath,
    schemaKind: file.schemaKind,
    contractId: file.contractId,
    issues: [...file.issues]
  };
}

function computeTotals(files: readonly FileValidationResult[]): ValidationTotals {
  const issues = collectIssues(files);

  return {
    files: files.length,
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length
  };
}

function collectIssues(files: readonly FileValidationResult[]): ValidationIssue[] {
  return files.flatMap((file) => [...file.issues]);
}

function renderIssueSection(title: string, issues: readonly ValidationIssue[]): string[] {
  if (issues.length === 0) {
    return [];
  }

  return [
    `${title}:`,
    ...issues.map((issue) => {
      const location = issue.field ? `${issue.filePath} (${issue.field})` : issue.filePath;
      return `  [${issue.code}] ${location}: ${issue.message}`;
    })
  ];
}

function getSchemaValidator(schemaKind: ContractSchemaKind): CompiledSchemaValidator {
  const existing = VALIDATOR_CACHE.get(schemaKind);
  if (existing) {
    return existing;
  }

  const schema = loadSchema(schemaKind);
  const validator = SCHEMA_VALIDATOR.compile(schema) as CompiledSchemaValidator;
  VALIDATOR_CACHE.set(schemaKind, validator);
  return validator;
}

function loadSchema(schemaKind: ContractSchemaKind): object {
  const schemaPath = CONTRACT_SCHEMA_PATHS[schemaKind];
  const cached = SCHEMA_CACHE.get(schemaPath);
  if (cached) {
    return cached;
  }

  const parsed = JSON.parse(readFileSync(schemaPath, "utf8")) as object;
  SCHEMA_CACHE.set(schemaPath, parsed);
  return parsed;
}

function schemaErrorField(error: ErrorObject): string | undefined {
  if (error.keyword === "required" && typeof error.params === "object" && error.params) {
    const missing = (error.params as { readonly missingProperty?: unknown }).missingProperty;
    if (typeof missing === "string" && missing.length > 0) {
      return missing;
    }
  }

  return error.instancePath.length > 0 ? error.instancePath.replace(/^\//, "") : undefined;
}

function formatSchemaError(error: ErrorObject): string {
  const location = schemaErrorField(error);
  const message = error.message ?? "schema validation failed";

  return location ? `${location} ${message}` : message;
}

function parseMajorVersion(version: string | null): number | null {
  if (!version) {
    return null;
  }

  const match = version.match(/^(\d+)\./);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1] ?? "", 10);
}

function extractDependencyIds(contract: ContractDocument): readonly string[] {
  const dependencies = readArray(contract, "dependencies");
  if (!dependencies) {
    return [];
  }

  return dependencies
    .map((dependency) => {
      if (!isRecord(dependency)) {
        return null;
      }

      const id = readStringProperty(dependency, "id");
      return id ?? null;
    })
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function readStringProperty(contract: ContractDocument, key: string): string | null {
  const value = contract[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readArray(contract: ContractDocument, key: string): readonly unknown[] | null {
  const value = contract[key];
  return Array.isArray(value) ? value : null;
}

function readStringArray(contract: ContractDocument, key: string): readonly string[] | null {
  const value = readArray(contract, key);
  if (!value) {
    return null;
  }

  return value.every((entry) => typeof entry === "string") ? (value as readonly string[]) : null;
}

function isContractDocument(value: unknown): value is ContractDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeValidationFormat(format: ValidationOutputFormat | undefined): ValidationOutputFormat {
  return format === "json" ? "json" : "text";
}

/*
 * Static scan entry point for cdad check.
 * This module inspects only repository structure and file metadata so the
 * signal set remains safe to run on any codebase.
 */

import { glob } from "glob";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  STATIC_SCAN_SIGNAL_LABELS
} from "../constants.js";

import type {
  StaticScanSignal,
  StaticScanSignalDefinition,
  StaticScanSignalKey,
  StaticScanSummary
} from "./types.js";

export type {
  StaticScanSignal,
  StaticScanSignalDefinition,
  StaticScanSignalKey,
  StaticScanSummary
} from "./types.js";

const STATIC_SCAN_ROOT_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**"
] as const;

const STATIC_SCAN_SIGNAL_DEFINITIONS: readonly StaticScanSignalDefinition[] = [
  {
    key: "agentContextFile",
    label: STATIC_SCAN_SIGNAL_LABELS.agentContextFile,
    description: "A lightweight agent context file is present.",
    kind: "positive",
    points: 1,
    patterns: ["**/CLAUDE.md", "**/.cursorrules"]
  },
  {
    key: "apiSpecs",
    label: STATIC_SCAN_SIGNAL_LABELS.apiSpecs,
    description: "An API contract file is present.",
    kind: "positive",
    points: 1,
    patterns: [
      "**/*openapi*.{yaml,yml,json}",
      "**/*asyncapi*.{yaml,yml,json}"
    ]
  },
  {
    key: "adrDirectory",
    label: STATIC_SCAN_SIGNAL_LABELS.adrDirectory,
    description: "An ADR directory exists under a conventional path.",
    kind: "positive",
    points: 1,
    patterns: ["adr", "decisions", "docs/adr"]
  },
  {
    key: "contractFiles",
    label: STATIC_SCAN_SIGNAL_LABELS.contractFiles,
    description: "C-DAD contract files are already in use.",
    kind: "positive",
    points: 4,
    patterns: ["**/*.contract.yaml", "cdad/**/contract.yaml"]
  },
  {
    key: "readme",
    label: STATIC_SCAN_SIGNAL_LABELS.readme,
    description: "A root README is present and has substantive content.",
    kind: "positive",
    points: 3,
    patterns: ["README.md"]
  },
  {
    key: "documentationDirectoryAbsent",
    label: STATIC_SCAN_SIGNAL_LABELS.documentationDirectoryAbsent,
    description: "No documentation directory exists at the repository root.",
    kind: "negative",
    points: 2,
    patterns: ["docs", "doc", "documentation"]
  },
  {
    key: "testsAbsent",
    label: STATIC_SCAN_SIGNAL_LABELS.testsAbsent,
    description: "No test files are present in the repository.",
    kind: "negative",
    points: 1,
    patterns: [
      "**/*.test.{ts,tsx,js,mjs,cjs}",
      "**/*.spec.{ts,tsx,js,mjs,cjs}"
    ]
  }
] as const;

const README_MINIMUM_BYTES = 512;

export { STATIC_SCAN_SIGNAL_DEFINITIONS };

export async function scanRepository(rootDir: string = process.cwd()): Promise<StaticScanSummary> {
  const absoluteRoot = resolve(rootDir);
  await assertPathExists(absoluteRoot);

  const findings = await Promise.all(
    STATIC_SCAN_SIGNAL_DEFINITIONS.map((definition) =>
      evaluateStaticScanSignal(absoluteRoot, definition)
    )
  );

  return summarizeStaticScan(findings);
}

export async function listStaticScanSignals(
  rootDir: string = process.cwd()
): Promise<readonly StaticScanSignal[]> {
  const summary = await scanRepository(rootDir);
  return summary.findings;
}

export function summarizeStaticScan(findings: readonly StaticScanSignal[]): StaticScanSummary {
  const foundCount = findings.filter((finding) => finding.found).length;
  const positivePoints = findings
    .filter((finding) => finding.found && finding.kind === "positive")
    .reduce((sum, finding) => sum + finding.points, 0);
  const penaltyPoints = findings
    .filter((finding) => finding.found && finding.kind === "negative")
    .reduce((sum, finding) => sum + finding.points, 0);
  const score = clampToRange(positivePoints - penaltyPoints, 0, 10);

  return {
    findings,
    foundCount,
    totalCount: findings.length,
    positivePoints,
    penaltyPoints,
    score
  };
}

async function evaluateStaticScanSignal(
  rootDir: string,
  definition: StaticScanSignalDefinition
): Promise<StaticScanSignal> {
  const matchedPaths = await collectSignalEvidence(rootDir, definition);
  const found = evaluateSignalPresence(definition.key, matchedPaths);
  const score = found ? (definition.kind === "positive" ? definition.points : -definition.points) : 0;

  return {
    key: definition.key,
    label: definition.label,
    description: definition.description,
    kind: definition.kind,
    found,
    points: definition.points,
    score,
    matchedPaths
  };
}

async function collectSignalEvidence(
  rootDir: string,
  definition: StaticScanSignalDefinition
): Promise<readonly string[]> {
  if (definition.key === "adrDirectory" || definition.key === "documentationDirectoryAbsent") {
    return collectDirectoryEvidence(rootDir, definition.patterns);
  }

  if (definition.key === "readme") {
    return collectReadmeEvidence(rootDir);
  }

  if (definition.key === "testsAbsent") {
    return collectTestEvidence(rootDir, definition.patterns);
  }

  return collectGlobEvidence(rootDir, definition.patterns);
}

async function collectGlobEvidence(
  rootDir: string,
  patterns: readonly string[]
): Promise<readonly string[]> {
  const matches = await Promise.all(
    patterns.map(async (pattern) =>
      glob(pattern, {
        cwd: rootDir,
        absolute: true,
        nodir: true,
        ignore: [...STATIC_SCAN_ROOT_IGNORE]
      })
    )
  );

  return uniqueSorted(matches.flat());
}

async function collectDirectoryEvidence(
  rootDir: string,
  directoryNames: readonly string[]
): Promise<readonly string[]> {
  const matches: string[] = [];

  for (const directoryName of directoryNames) {
    const absolutePath = resolve(rootDir, directoryName);
    if (await isDirectory(absolutePath)) {
      matches.push(absolutePath);
    }
  }

  return uniqueSorted(matches);
}

async function collectReadmeEvidence(rootDir: string): Promise<readonly string[]> {
  const readmePath = resolve(rootDir, "README.md");
  if (!(await isFile(readmePath))) {
    return [];
  }

  const metadata = await stat(readmePath);

  // A size threshold lets us distinguish a real README from a placeholder
  // without reading private code or content.
  if (metadata.size < README_MINIMUM_BYTES) {
    return [];
  }

  return [readmePath];
}

async function collectTestEvidence(
  rootDir: string,
  patterns: readonly string[]
): Promise<readonly string[]> {
  const fileEvidence = await collectGlobEvidence(rootDir, patterns);
  const directoryEvidence = await collectDirectoryEvidence(rootDir, ["test", "tests"]);
  return uniqueSorted([...fileEvidence, ...directoryEvidence]);
}

function evaluateSignalPresence(
  key: StaticScanSignalKey,
  matchedPaths: readonly string[]
): boolean {
  if (key === "documentationDirectoryAbsent") {
    return matchedPaths.length === 0;
  }

  if (key === "testsAbsent") {
    return matchedPaths.length === 0;
  }

  if (key === "readme") {
    return matchedPaths.length > 0;
  }

  return matchedPaths.length > 0;
}

async function assertPathExists(path: string): Promise<void> {
  if (!(await isPath(path))) {
    throw new Error(`Cannot scan repository root: ${path}`);
  }
}

async function isPath(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values)).sort();
}

function clampToRange(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

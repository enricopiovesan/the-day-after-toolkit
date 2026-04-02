/*
 * Report parser for cdad roadmap.
 * The roadmap command reads the markdown report artifact produced by cdad check
 * and turns it into the structured roadmap domain model.
 */

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { load as loadYaml } from "js-yaml";

import { ROADMAP_INPUT_REPORT_NAME } from "./constants.js";
import type { RoadmapCapabilityInput } from "./types.js";

export interface ParsedRoadmapReport {
  readonly reportPath: string;
  readonly generatedAt: string;
  readonly reportScore: number;
  readonly summary: string;
  readonly capabilities: readonly RoadmapCapabilityInput[];
}

interface ReportFrontmatter {
  readonly generated_by?: unknown;
  readonly generated_at?: unknown;
  readonly repo?: unknown;
  readonly score?: unknown;
  readonly band?: unknown;
  readonly schema_version?: unknown;
}

interface ReportGapEntry {
  readonly capability?: unknown;
  readonly gap_type?: unknown;
  readonly gapType?: unknown;
  readonly severity?: unknown;
}

interface ReportGapInventory {
  readonly gaps?: readonly ReportGapEntry[];
}

export async function loadRoadmapReport(inputPath: string): Promise<ParsedRoadmapReport> {
  const reportPath = await resolveReportPath(inputPath);
  const markdown = await readFile(reportPath, "utf8");
  return parseRoadmapReport(markdown, reportPath);
}

export function parseRoadmapReport(markdown: string, reportPath: string): ParsedRoadmapReport {
  const frontmatter = parseFrontmatter(markdown, reportPath);
  const summary = parseSummarySection(markdown, reportPath);
  const sectionCapabilities = parseCapabilitySections(markdown, reportPath);
  const inventoryCapabilities = parseGapInventory(markdown, reportPath);
  const capabilities = mergeCapabilities(sectionCapabilities, inventoryCapabilities, reportPath);

  return {
    reportPath,
    generatedAt: normalizeTimestamp(frontmatter.generated_at) ?? new Date().toISOString(),
    reportScore: normalizeNumber(frontmatter.score, reportPath, "score"),
    summary,
    capabilities
  };
}

async function resolveReportPath(inputPath: string): Promise<string> {
  const absoluteInput = resolve(inputPath);
  const inputStat = await stat(absoluteInput).catch(() => null);

  if (inputStat?.isDirectory()) {
    return resolve(absoluteInput, ROADMAP_INPUT_REPORT_NAME);
  }

  return absoluteInput;
}

function parseFrontmatter(markdown: string, reportPath: string): ReportFrontmatter {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);

  if (!match) {
    throw new Error(`${reportPath}: missing YAML frontmatter block. Regenerate the report with cdad check.`);
  }

  const parsed = loadYaml(match[1] ?? "");

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${reportPath}: invalid YAML frontmatter. Regenerate the report with cdad check.`);
  }

  return parsed as ReportFrontmatter;
}

function parseSummarySection(markdown: string, reportPath: string): string {
  const summarySection = sliceSection(markdown, "## Summary", "## Static Scan Results");

  if (!summarySection) {
    throw new Error(`${reportPath}: missing Summary section. Regenerate the report with cdad check.`);
  }

  const lines = summarySection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("**Overall score:**"));

  return lines.join(" ");
}

function parseCapabilitySections(
  markdown: string,
  reportPath: string
): readonly RoadmapCapabilityInput[] {
  const capabilitySection = sliceSection(
    markdown,
    "## Capability Legibility Assessment",
    "## Gap Inventory"
  );

  if (!capabilitySection) {
    throw new Error(
      `${reportPath}: missing Capability Legibility Assessment section. Regenerate the report with cdad check.`
    );
  }

  const capabilities: RoadmapCapabilityInput[] = [];
  const blocks = capabilitySection.matchAll(
    /### ([^\n]+)\n([\s\S]*?)(?=\n### |\n$)/g
  );

  for (const block of blocks) {
    const capability = block[1]?.trim();
    const body = block[2] ?? "";

    if (!capability) {
      continue;
    }

    const legibilityScoreMatch = body.match(/\*\*Legibility score:\*\* ([0-9.]+) \/ 4/);

    if (!legibilityScoreMatch) {
      throw new Error(
        `${reportPath}: capability ${capability} is missing a legibility score. Regenerate the report with cdad check.`
      );
    }

    capabilities.push({
      capability,
      legibilityScore: Number.parseFloat(legibilityScoreMatch[1] ?? "0"),
      businessCriticality: 0,
      agentTouchpointFrequency: 0,
      primaryGaps: extractCapabilityGaps(body)
    });
  }

  return capabilities;
}

function parseGapInventory(markdown: string, reportPath: string): Map<string, readonly string[]> {
  const inventorySection = sliceSection(markdown, "## Gap Inventory", "## Recommended Next Step");

  if (!inventorySection) {
    return new Map<string, readonly string[]>();
  }

  const inventoryMatch = inventorySection.match(/```yaml\n([\s\S]*?)\n```/);

  if (!inventoryMatch) {
    throw new Error(
      `${reportPath}: Gap Inventory section is missing the YAML block. Regenerate the report with cdad check.`
    );
  }

  const parsed = loadYaml(inventoryMatch[1] ?? "");

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      `${reportPath}: Gap Inventory YAML block is malformed. Regenerate the report with cdad check.`
    );
  }

  const inventory = parsed as ReportGapInventory;
  const grouped = new Map<string, string[]>();

  for (const gap of inventory.gaps ?? []) {
    const capability = normalizeString(gap.capability);
    const gapType = normalizeString(gap.gap_type) ?? normalizeString(gap.gapType);

    if (!capability || !gapType) {
      continue;
    }

    const gaps = grouped.get(capability) ?? [];
    gaps.push(normalizeGapLabel(gapType));
    grouped.set(capability, gaps);
  }

  return new Map(
    [...grouped.entries()].map(([capability, gaps]) => [capability, uniqueStrings(gaps)] as const)
  );
}

function mergeCapabilities(
  sectionCapabilities: readonly RoadmapCapabilityInput[],
  inventoryCapabilities: Map<string, readonly string[]>,
  reportPath: string
): readonly RoadmapCapabilityInput[] {
  const capabilitiesByName = new Map<string, RoadmapCapabilityInput>();

  for (const capability of sectionCapabilities) {
    const inventoryGaps = inventoryCapabilities.get(capability.capability) ?? [];
    capabilitiesByName.set(capability.capability, {
      ...capability,
      primaryGaps: inventoryGaps.length > 0 ? inventoryGaps : capability.primaryGaps
    });
  }

  for (const [capability, gaps] of inventoryCapabilities.entries()) {
    if (capabilitiesByName.has(capability)) {
      continue;
    }

    capabilitiesByName.set(capability, {
      capability,
      legibilityScore: 0,
      businessCriticality: 0,
      agentTouchpointFrequency: 0,
      primaryGaps: gaps
    });
  }

  const capabilities = [...capabilitiesByName.values()];
  if (capabilities.length === 0) {
    throw new Error(
      `${reportPath}: no capabilities were found in the report. Regenerate the report with cdad check.`
    );
  }

  return capabilities;
}

function extractCapabilityGaps(body: string): string[] {
  const rows = body.match(/\| [^\n]+\| [^\n]+\| [^\n]+\|/g) ?? [];
  const gaps: string[] = [];

  for (const row of rows) {
    const cells = row
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length < 3) {
      continue;
    }

    if ((cells[0] ?? "").toLowerCase() === "question") {
      continue;
    }

    if ((cells[1] ?? "").toLowerCase() === "yes") {
      continue;
    }

    const gapLabel = normalizeGapLabel(cells[2] ?? "");
    if (gapLabel.length > 0) {
      gaps.push(gapLabel);
    }
  }

  return uniqueStrings(gaps);
}

function sliceSection(markdown: string, startHeading: string, endHeading: string): string | null {
  const startIndex = markdown.indexOf(startHeading);
  if (startIndex < 0) {
    return null;
  }

  const endIndex = markdown.indexOf(endHeading, startIndex + startHeading.length);
  if (endIndex < 0) {
    return markdown.slice(startIndex + startHeading.length);
  }

  return markdown.slice(startIndex + startHeading.length, endIndex);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTimestamp(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeString(value);
}

function normalizeNumber(value: unknown, reportPath: string, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${reportPath}: frontmatter field ${fieldName} must be a number. Regenerate the report with cdad check.`);
  }

  return value;
}

function normalizeGapLabel(value: string): string {
  return value
    .replace(/\s+(absent|partial)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

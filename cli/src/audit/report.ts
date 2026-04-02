/*
 * Report generator for cdad check.
 * This module turns the audit domain model into the markdown and terminal
 * artifacts that later command handlers can surface without adding policy.
 */

import {
  CHECK_REPORT_BAND_BADGES,
  CHECK_REPORT_BAND_LABELS,
  CHECK_REPORT_BAND_SUMMARIES,
  CHECK_REPORT_CAPABILITY_TITLE,
  CHECK_REPORT_SCHEMA_VERSION,
  CHECK_REPORT_FULL_REPORT_SAVED_PREFIX,
  CHECK_REPORT_GENERATED_BY,
  CHECK_REPORT_GAP_INVENTORY_TITLE,
  CHECK_REPORT_NO_GAPS_SUMMARY,
  CHECK_REPORT_QUESTIONNAIRE_PREFIX,
  CHECK_REPORT_RECOMMENDED_NEXT_STEP,
  CHECK_REPORT_RECOMMENDED_NEXT_STEP_TITLE,
  CHECK_REPORT_STATIC_SCAN_PREFIX,
  CHECK_REPORT_STATIC_SCAN_TITLE,
  CHECK_REPORT_SUMMARY_TITLE,
  CHECK_REPORT_TITLE,
  CHECK_REPORT_TOP_GAPS_TITLE,
  CHECK_REPORT_OVERALL_SCORE_PREFIX,
  CHECK_REPORT_PRIMARY_RISK_PREFIX,
  CHECK_REPORT_CAPABILITY_RISK_NO_GAPS,
  CHECK_REPORT_CAPABILITY_RISK_PREFIX,
  CHECK_REPORT_TOP_RISK_LINKING,
  DEFAULT_REPORT_OUTPUT,
  LEGIBILITY_ANSWER_LABELS,
  LEGIBILITY_QUESTION_LABELS,
  LEGIBILITY_GAP_LABELS,
  STATIC_SCAN_FOUND_LABELS
} from "../constants.js";
import { formatHeader, formatNextStep } from "../utils/logger.js";

import { computeCheckScore } from "./scorer.js";
import type {
  CapabilityAssessment,
  CapabilityGap,
  CapabilityGapSummary,
  CheckReport,
  CheckReportFrontmatter,
  CheckReportInput,
  CheckBand,
  StaticScanSummary
} from "./types.js";

export function createCheckReport(input: CheckReportInput): CheckReport {
  const { overallScore, band } = computeCheckScore(input.questionnaire, input.staticScan);
  const capabilitySummaries = createCapabilitySummaries(input.questionnaire.capabilities);
  const gapInventory = [...input.questionnaire.gapInventory].sort(compareGaps);

  return {
    frontmatter: createFrontmatter(input.repo, input.generatedAt, overallScore, band),
    repo: input.repo,
    generatedAt: input.generatedAt,
    staticScan: input.staticScan,
    questionnaire: input.questionnaire,
    overallScore,
    band,
    capabilitySummaries,
    gapInventory
  };
}

export function renderCheckReportMarkdown(report: CheckReport): string {
  const lines: string[] = [];
  lines.push(renderFrontmatter(report.frontmatter));
  lines.push(`# ${CHECK_REPORT_TITLE}`);
  lines.push("");
  lines.push(`## ${CHECK_REPORT_SUMMARY_TITLE}`);
  lines.push("");
  lines.push(
    `**${CHECK_REPORT_OVERALL_SCORE_PREFIX}** ${formatScore(report.overallScore)} / 10 — ${formatBandLabel(report.band)}`
  );
  lines.push("");
  lines.push(renderSummaryParagraph(report));
  lines.push("");
  lines.push(`## ${CHECK_REPORT_STATIC_SCAN_TITLE}`);
  lines.push("");
  lines.push("| Signal | Found | Score |");
  lines.push("|---|---|---|");

  for (const finding of report.staticScan.findings) {
    lines.push(
      `| ${finding.label} | ${finding.found ? STATIC_SCAN_FOUND_LABELS.yes : STATIC_SCAN_FOUND_LABELS.no} | ${formatScore(finding.score)} |`
    );
  }

  lines.push("");
  lines.push(`**Static scan score:** ${formatScore(report.staticScan.score)}/10`);
  lines.push("");
  lines.push(`## ${CHECK_REPORT_CAPABILITY_TITLE}`);
  lines.push("");

  for (const capability of report.questionnaire.capabilities) {
    lines.push(renderCapabilitySection(capability));
    lines.push("");
  }

  lines.push(`## ${CHECK_REPORT_GAP_INVENTORY_TITLE}`);
  lines.push("");
  lines.push("```yaml");
  lines.push("gaps:");

  for (const gap of report.gapInventory) {
    lines.push(`  - capability: ${serializeYamlScalar(gap.capability)}`);
    lines.push(`    gap_type: ${gap.gapType}`);
    lines.push(`    severity: ${gap.severity}`);
  }

  lines.push("```");
  lines.push("");
  lines.push(`## ${CHECK_REPORT_RECOMMENDED_NEXT_STEP_TITLE}`);
  lines.push("");
  lines.push(CHECK_REPORT_RECOMMENDED_NEXT_STEP);

  return lines.join("\n");
}

export function renderCheckReportJson(report: CheckReport): string {
  return JSON.stringify(report, null, 2);
}

export function renderCheckTerminalSummary(report: CheckReport): string {
  const lines: string[] = [];
  lines.push(formatHeader("check", CHECK_REPORT_TITLE));
  lines.push("");
  lines.push(
    `${CHECK_REPORT_STATIC_SCAN_PREFIX} ${formatScore(report.staticScan.score)}/10 signals found`
  );
  lines.push(
    `${CHECK_REPORT_QUESTIONNAIRE_PREFIX} ${report.questionnaire.assessedCount} capabilities assessed`
  );
  lines.push("");
  lines.push(
    `${CHECK_REPORT_OVERALL_SCORE_PREFIX} ${formatScore(report.overallScore)} / 10  ${CHECK_REPORT_BAND_BADGES[report.band]}`
  );
  lines.push("");
  lines.push(`${CHECK_REPORT_TOP_GAPS_TITLE}:`);

  const rankedGapSummaries = report.capabilitySummaries.filter(
    (gapSummary) => gapSummary.gapTypes.length > 0
  );

  for (const gapSummary of rankedGapSummaries.slice(0, 3)) {
    lines.push(`  ✗ ${padCapability(gapSummary.capability)} — ${gapSummary.summary}`);
  }

  if (rankedGapSummaries.length === 0) {
    lines.push(`  ${CHECK_REPORT_NO_GAPS_SUMMARY}`);
  }

  lines.push("");
  lines.push(`${CHECK_REPORT_FULL_REPORT_SAVED_PREFIX} ${DEFAULT_REPORT_OUTPUT}`);
  lines.push("");
  lines.push(formatNextStep(CHECK_REPORT_RECOMMENDED_NEXT_STEP));

  return lines.join("\n");
}

export function createCapabilitySummaries(
  capabilities: readonly CapabilityAssessment[]
): readonly CapabilityGapSummary[] {
  return capabilities
    .map((capability) => ({
      capability: capability.capability,
      score: capability.score,
      severity: highestSeverity(capability.gaps),
      gapTypes: capability.gaps.map((gap) => gap.gapType),
      summary: capability.gaps.length === 0 ? CHECK_REPORT_NO_GAPS_SUMMARY : summarizeGaps(capability.gaps)
    }))
    .sort(compareCapabilitySummaries);
}

export function renderStaticScanTable(staticScan: StaticScanSummary): string {
  const lines: string[] = [];
  lines.push("| Signal | Found | Score |");
  lines.push("|---|---|---|");

  for (const finding of staticScan.findings) {
    lines.push(
      `| ${finding.label} | ${finding.found ? STATIC_SCAN_FOUND_LABELS.yes : STATIC_SCAN_FOUND_LABELS.no} | ${formatScore(finding.score)} |`
    );
  }

  return lines.join("\n");
}

export function renderCapabilitySection(capability: CapabilityAssessment): string {
  const lines: string[] = [];
  lines.push(`### ${capability.capability}`);
  lines.push(`**Legibility score:** ${formatScore(capability.score)} / 4`);
  lines.push("");
  lines.push("| Question | Answer | Gap type |");
  lines.push("|---|---|---|");
  lines.push(renderCapabilityRow("businessRules", capability.answers.businessRules));
  lines.push(renderCapabilityRow("constraintHistory", capability.answers.constraintHistory));
  lines.push(renderCapabilityRow("dependencyRationale", capability.answers.dependencyRationale));
  lines.push(renderCapabilityRow("exceptionLogic", capability.answers.exceptionLogic));

  lines.push("");
  lines.push(`**Risk:** ${describeCapabilityRisk(capability)}`);

  return lines.join("\n");
}

function renderSummaryParagraph(report: CheckReport): string {
  const summary = CHECK_REPORT_BAND_SUMMARIES[report.band];
  const riskSentence = report.capabilitySummaries.length === 0
    ? CHECK_REPORT_NO_GAPS_SUMMARY
    : `${CHECK_REPORT_PRIMARY_RISK_PREFIX} ${describeTopRisk(report.capabilitySummaries)}`;

  return `${summary} ${riskSentence}`;
}

function createFrontmatter(
  repo: string,
  generatedAt: string,
  overallScore: number,
  band: CheckBand
): CheckReportFrontmatter {
  return {
    generated_by: CHECK_REPORT_GENERATED_BY,
    generated_at: generatedAt,
    repo,
    score: overallScore,
    band,
    schema_version: CHECK_REPORT_SCHEMA_VERSION
  };
}

function renderFrontmatter(frontmatter: CheckReportFrontmatter): string {
  return [
    "---",
    `generated_by: ${frontmatter.generated_by}`,
    `generated_at: ${frontmatter.generated_at}`,
    `repo: ${frontmatter.repo}`,
    `score: ${formatScore(frontmatter.score)}`,
    `band: ${frontmatter.band}`,
    `schema_version: ${frontmatter.schema_version}`,
    "---"
  ].join("\n");
}

function summarizeGaps(gaps: readonly CapabilityGap[]): string {
  return gaps.map((gap) => gap.label).join(", ");
}

function highestSeverity(gaps: readonly CapabilityGap[]): CapabilityGapSummary["severity"] {
  if (gaps.some((gap) => gap.severity === "critical")) {
    return "critical";
  }

  if (gaps.some((gap) => gap.severity === "high")) {
    return "high";
  }

  return "medium";
}

function describeCapabilityRisk(capability: CapabilityAssessment): string {
  if (capability.gaps.length === 0) {
    return CHECK_REPORT_CAPABILITY_RISK_NO_GAPS;
  }

  return `${CHECK_REPORT_CAPABILITY_RISK_PREFIX} ${summarizeGaps(capability.gaps)}.`;
}

function describeTopRisk(capabilitySummaries: readonly CapabilityGapSummary[]): string {
  const topSummary = capabilitySummaries.find((summary) => summary.gapTypes.length > 0);
  if (!topSummary) {
    return CHECK_REPORT_NO_GAPS_SUMMARY;
  }

  return `${topSummary.capability} ${CHECK_REPORT_TOP_RISK_LINKING} ${topSummary.summary}.`;
}

function compareCapabilitySummaries(
  left: CapabilityGapSummary,
  right: CapabilityGapSummary
): number {
  if (left.score !== right.score) {
    return left.score - right.score;
  }

  return left.capability.localeCompare(right.capability);
}

function compareGaps(left: CapabilityGap, right: CapabilityGap): number {
  if (left.capability !== right.capability) {
    return left.capability.localeCompare(right.capability);
  }

  return left.gapType.localeCompare(right.gapType);
}

function formatQuestionLabel(gapType: CapabilityGap["gapType"]): string {
  return LEGIBILITY_QUESTION_LABELS[gapType];
}

function renderCapabilityRow(
  gapType: CapabilityGap["gapType"],
  answer: CapabilityAssessment["answers"][keyof CapabilityAssessment["answers"]]
): string {
  const gapLabel = answer === "yes" ? "None" : getGapLabel(gapType, answer);
  return `| ${formatQuestionLabel(gapType)} | ${formatAnswer(answer)} | ${gapLabel} |`;
}

function getGapLabel(
  gapType: CapabilityGap["gapType"],
  answer: CapabilityAssessment["answers"][keyof CapabilityAssessment["answers"]]
): string {
  if (answer === "yes") {
    return "None";
  }

  if (gapType === "businessRules") {
    return answer === "partially"
      ? LEGIBILITY_GAP_LABELS.businessRulesPartial
      : LEGIBILITY_GAP_LABELS.businessRules;
  }

  if (gapType === "constraintHistory") {
    return answer === "partially"
      ? LEGIBILITY_GAP_LABELS.constraintHistoryPartial
      : LEGIBILITY_GAP_LABELS.constraintHistory;
  }

  if (gapType === "dependencyRationale") {
    return answer === "partially"
      ? LEGIBILITY_GAP_LABELS.dependencyRationalePartial
      : LEGIBILITY_GAP_LABELS.dependencyRationale;
  }

  return answer === "partially"
    ? LEGIBILITY_GAP_LABELS.exceptionLogicPartial
    : LEGIBILITY_GAP_LABELS.exceptionLogic;
}

function formatAnswer(
  answer: CapabilityAssessment["answers"][keyof CapabilityAssessment["answers"]]
): string {
  if (answer === "yes") {
    return LEGIBILITY_ANSWER_LABELS.yes;
  }

  if (answer === "partially") {
    return LEGIBILITY_ANSWER_LABELS.partially;
  }

  return LEGIBILITY_ANSWER_LABELS.no;
}

function formatBandLabel(band: CheckReport["band"]): string {
  return CHECK_REPORT_BAND_LABELS[band];
}

function formatScore(score: number): string {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
}

function padCapability(capability: string): string {
  return capability.padEnd(20, " ");
}

function serializeYamlScalar(value: string): string {
  if (/^[A-Za-z0-9/_-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

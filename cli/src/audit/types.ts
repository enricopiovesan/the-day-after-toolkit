/*
 * Shared domain types for cdad check.
 * This file keeps the audit model stable so the scanner, questionnaire,
 * scoring engine, and report renderer can evolve independently.
 */

export type LegibilityAnswer = "yes" | "partially" | "no";

export const LEGIBILITY_QUESTION_KEYS = [
  "businessRules",
  "constraintHistory",
  "dependencyRationale",
  "exceptionLogic"
] as const;

export type LegibilityQuestionKey = (typeof LEGIBILITY_QUESTION_KEYS)[number];

export type GapSeverity = "critical" | "high" | "medium";

export type CheckBand = "red" | "amber" | "yellow" | "green";

export type StaticScanSignalKey =
  | "agentContextFile"
  | "apiSpecs"
  | "adrDirectory"
  | "contractFiles"
  | "readme"
  | "documentationDirectoryAbsent"
  | "testsAbsent";

export type StaticScanSignalKind = "positive" | "negative";

export interface StaticScanSignalDefinition {
  readonly key: StaticScanSignalKey;
  readonly label: string;
  readonly description: string;
  readonly kind: StaticScanSignalKind;
  readonly points: number;
  readonly patterns: readonly string[];
}

export interface StaticScanSignal {
  readonly key: StaticScanSignalKey;
  readonly label: string;
  readonly description: string;
  readonly kind: StaticScanSignalKind;
  readonly found: boolean;
  readonly points: number;
  readonly score: number;
  readonly matchedPaths: readonly string[];
}

export interface StaticScanSummary {
  readonly findings: readonly StaticScanSignal[];
  readonly foundCount: number;
  readonly totalCount: number;
  readonly positivePoints: number;
  readonly penaltyPoints: number;
  readonly score: number;
}

export interface CapabilityAnswerSet {
  readonly businessRules: LegibilityAnswer;
  readonly constraintHistory: LegibilityAnswer;
  readonly dependencyRationale: LegibilityAnswer;
  readonly exceptionLogic: LegibilityAnswer;
}

export interface CapabilityGap {
  readonly capability: string;
  readonly gapType: LegibilityQuestionKey;
  readonly label: string;
  readonly severity: GapSeverity;
  readonly answer: LegibilityAnswer;
}

export interface CapabilityAssessment {
  readonly capability: string;
  readonly answers: CapabilityAnswerSet;
  readonly score: number;
  readonly gaps: readonly CapabilityGap[];
}

export interface QuestionnaireSummary {
  readonly capabilities: readonly CapabilityAssessment[];
  readonly assessedCount: number;
  readonly maxScore: number;
  readonly score: number;
  readonly gapInventory: readonly CapabilityGap[];
}

export interface CheckReportFrontmatter {
  readonly generated_by: string;
  readonly generated_at: string;
  readonly repo: string;
  readonly score: number;
  readonly band: CheckBand;
  readonly schema_version: string;
}

export interface CapabilityGapSummary {
  readonly capability: string;
  readonly score: number;
  readonly severity: GapSeverity;
  readonly gapTypes: readonly LegibilityQuestionKey[];
  readonly summary: string;
}

export interface CheckReport {
  readonly frontmatter: CheckReportFrontmatter;
  readonly repo: string;
  readonly generatedAt: string;
  readonly staticScan: StaticScanSummary;
  readonly questionnaire: QuestionnaireSummary;
  readonly overallScore: number;
  readonly band: CheckBand;
  readonly capabilitySummaries: readonly CapabilityGapSummary[];
  readonly gapInventory: readonly CapabilityGap[];
}

export interface CheckReportInput {
  readonly repo: string;
  readonly generatedAt: string;
  readonly staticScan: StaticScanSummary;
  readonly questionnaire: QuestionnaireSummary;
}

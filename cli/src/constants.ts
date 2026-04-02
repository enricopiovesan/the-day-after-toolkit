/*
 * Centralizes user-visible copy, filenames, and repeated defaults so the CLI's
 * public contract can be reviewed in one place.
 */

export const TOOL_NAME = "cdad";
export const SCHEMA_VERSION = "1.0.0";
export const CHECK_REPORT_SCHEMA_VERSION = SCHEMA_VERSION;
export const DEFAULT_CONTRACTS_DIRECTORY = "cdad";
export const DEFAULT_REPORT_OUTPUT = "cdad-report.md";
export const DEFAULT_ROADMAP_OUTPUT = "cdad-roadmap.md";
export const DEFAULT_GRAPH_OUTPUT_DIRECTORY = ".";

export const CHECK_REPORT_GENERATED_BY = "cdad check";
export const CHECK_REPORT_TITLE = "Agent Readiness Report";
export const CHECK_REPORT_SUMMARY_TITLE = "Summary";
export const CHECK_REPORT_STATIC_SCAN_TITLE = "Static Scan Results";
export const CHECK_REPORT_CAPABILITY_TITLE = "Capability Legibility Assessment";
export const CHECK_REPORT_GAP_INVENTORY_TITLE = "Gap Inventory";
export const CHECK_REPORT_RECOMMENDED_NEXT_STEP_TITLE = "Recommended Next Step";
export const CHECK_REPORT_RECOMMENDED_NEXT_STEP = "Run `cdad roadmap` to generate your transformation plan based on this report.";
export const CHECK_REPORT_TOP_GAPS_TITLE = "Top gaps identified";
export const CHECK_REPORT_FULL_REPORT_SAVED_PREFIX = "Full report saved to:";
export const CHECK_REPORT_STATIC_SCAN_PREFIX = "Static scan:";
export const CHECK_REPORT_QUESTIONNAIRE_PREFIX = "Questionnaire:";
export const CHECK_REPORT_OVERALL_SCORE_PREFIX = "Overall score:";

export const CHECK_REPORT_BAND_LABELS = {
  red: "Not agent-ready",
  amber: "Partially agent-ready",
  yellow: "Moderately agent-ready",
  green: "Agent-ready"
} as const;

export const CHECK_REPORT_BAND_BADGES = {
  red: "✗ NOT AGENT-READY",
  amber: "⚠ PARTIALLY AGENT-READY",
  yellow: "◐ MODERATELY AGENT-READY",
  green: "✓ AGENT-READY"
} as const;

export const CHECK_REPORT_BAND_SUMMARIES = {
  red: "This repository still hides too much context for an agent to move safely. The missing legibility is concentrated in the gaps below.",
  amber: "This repository exposes some useful structure, but several business questions still depend on tribal knowledge. The gaps below are the highest-risk failure modes.",
  yellow: "This repository is usable with supervision, but an agent still needs help on the edges. The gaps below are the places most likely to cause slowdowns or mistakes.",
  green: "This repository exposes enough structure for an agent to navigate with confidence. The remaining gaps are limited and explicit."
} as const;

export const CHECK_REPORT_PRIMARY_RISK_PREFIX = "The primary risk today is that";
export const CHECK_REPORT_NO_GAPS_SUMMARY =
  "The report does not show any remaining legibility gaps.";
export const CHECK_REPORT_CAPABILITY_RISK_NO_GAPS =
  "An agent has enough legibility here to move with minimal supervision.";
export const CHECK_REPORT_CAPABILITY_RISK_PREFIX = "This capability still depends on";
export const CHECK_REPORT_TOP_RISK_LINKING = "still depends on";

export const LEGIBILITY_QUESTION_PROMPTS = {
  businessRules:
    "Can someone understand WHY this capability works this way — not just what it does — using only what the system makes available?",
  constraintHistory:
    "Can someone identify what was tried before, what failed, and why — without asking anyone who was there?",
  dependencyRationale:
    "Can someone understand why this capability calls what it calls, in the way it does, rather than the obvious alternative?",
  exceptionLogic:
    "Can someone identify every code path that exists because of a specific customer, regulatory, or historical condition — without tribal knowledge?"
} as const;

export const LEGIBILITY_QUESTION_LABELS = {
  businessRules: "Business Rules Legibility",
  constraintHistory: "Constraint History Legibility",
  dependencyRationale: "Dependency Rationale Legibility",
  exceptionLogic: "Exception Logic Legibility"
} as const;

export const LEGIBILITY_ANSWER_LABELS = {
  yes: "Yes",
  partially: "Partially",
  no: "No"
} as const;

export const STATIC_SCAN_FOUND_LABELS = {
  yes: "Yes",
  no: "No"
} as const;

export const LEGIBILITY_GAP_LABELS = {
  businessRules: "Business rules absent",
  businessRulesPartial: "Business rules partial",
  constraintHistory: "Constraint history absent",
  constraintHistoryPartial: "Constraint history partial",
  dependencyRationale: "Dependency rationale absent",
  dependencyRationalePartial: "Dependency rationale partial",
  exceptionLogic: "Exception logic absent",
  exceptionLogicPartial: "Exception logic partial"
} as const;

export const STATIC_SCAN_SIGNAL_LABELS = {
  agentContextFile: "CLAUDE.md or .cursorrules present",
  apiSpecs: "OpenAPI / AsyncAPI specs found",
  adrDirectory: "ADR directory found",
  contractFiles: "Contract files found",
  readme: "README.md exists and is non-trivial",
  documentationDirectoryAbsent: "No documentation directory",
  testsAbsent: "No tests found"
} as const;

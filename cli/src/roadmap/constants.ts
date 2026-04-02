/*
 * Centralized user-facing strings and threshold values for the roadmap flow.
 * Keeping these together makes the generator and prioritizer stay aligned with the spec.
 */

export const ROADMAP_GENERATED_BY = "cdad roadmap";
export const ROADMAP_SCHEMA_VERSION = "1.0.0";
export const ROADMAP_TITLE = "Transformation Roadmap";
export const ROADMAP_AGENT_READINESS_LABEL = "Agent-Readiness Score";
export const ROADMAP_REPORT_HEADING = "Agent Readiness Report";
export const ROADMAP_INPUT_REPORT_NAME = "cdad-report.md";
export const ROADMAP_NEXT_STEPS_TITLE = "Next Steps";
export const ROADMAP_PRIORITY_TABLE_TITLE = "Capability Priority Table";
export const ROADMAP_NOT_CURRENT_CANDIDATE_TITLE = "Not a Current Extraction Candidate";
export const ROADMAP_DEFAULT_CAPTURE_NOTE = "Capture the highest-risk constraint first.";
export const ROADMAP_DEFAULT_SUMMARY =
  "This roadmap focuses the first extraction work on the capabilities most likely to fail under agent navigation.";
export const ROADMAP_COMMAND_HEADER_DESCRIPTION = "Transformation Roadmap";
export const ROADMAP_COMMAND_NEXT_STEP =
  "run `cdad init payment/retry` to scaffold the first contract.";
export const ROADMAP_COMMAND_OUTPUT_PREFIX = "Roadmap saved to:";
export const ROADMAP_COMMAND_PRIORITY_PREFIX = "Priority order:";
export const ROADMAP_COMMAND_COMPLETE_PREFIX = "Prioritization complete.";
export const ROADMAP_COMMAND_BASENAME = "cdad-roadmap.md";
export const ROADMAP_COMMAND_JSON_BASENAME = "cdad-roadmap.json";
export const ROADMAP_CRITICALITY_PROMPT = "Business criticality (1-3):";
export const ROADMAP_FREQUENCY_PROMPT = "Agent touchpoint frequency (1-3):";
export const ROADMAP_PROMPT_OPTION_LABELS = {
  1: "1 = supporting function, limited revenue impact",
  2: "2 = important but not on the critical revenue path",
  3: "3 = directly on the critical revenue / compliance path"
} as const;
export const ROADMAP_FREQUENCY_OPTION_LABELS = {
  1: "1 = agents will rarely navigate this capability",
  2: "2 = agents will navigate this capability regularly",
  3: "3 = agents will navigate this capability constantly — it is a high-traffic node"
} as const;

export const ROADMAP_PHASE_1_HEADING = "## Phase 1 — Immediate (Weeks 1–4)";
export const ROADMAP_PHASE_2_HEADING = "## Phase 2 — Near-term (Weeks 4–12)";
export const ROADMAP_PHASE_3_HEADING = "## Phase 3 — Ongoing";
export const ROADMAP_PHASE_0_HEADING = `## ${ROADMAP_NOT_CURRENT_CANDIDATE_TITLE}`;

export const ROADMAP_PHASE_1_DESCRIPTION =
  "These capabilities carry the highest combined priority score. An agent deployed today is most likely to fail here. Contract these first.";
export const ROADMAP_PHASE_2_DESCRIPTION =
  "These capabilities still need extraction work, but they are not the first failure surface.";
export const ROADMAP_PHASE_3_DESCRIPTION =
  "These capabilities can be extracted as capacity allows after the highest-risk work lands.";
export const ROADMAP_PHASE_0_DESCRIPTION =
  "These capabilities are not current extraction candidates because at least one prioritization axis is zero.";

export const ROADMAP_PHASE_1_THRESHOLD = 9;
export const ROADMAP_PHASE_2_THRESHOLD = 4;
export const ROADMAP_PHASE_3_THRESHOLD = 1;

export const ROADMAP_NEXT_STEPS = [
  "Run `cdad init payment/retry` to scaffold the first contract",
  "Fill in the YAML template — focus on the fields flagged as missing above",
  "Run `cdad validate payment/retry/contract.yaml` to check the contract",
  "Run `cdad check` again after Phase 1 to measure progress"
] as const;

export const ROADMAP_PRIORITY_TABLE_HEADERS = [
  "| Capability | Criticality | Density | Frequency | Score | Phase |",
  "|---|---|---|---|---|---|"
] as const;

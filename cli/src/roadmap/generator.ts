/*
 * Markdown generator for cdad-roadmap.md.
 */

import {
  ROADMAP_AGENT_READINESS_LABEL,
  ROADMAP_DEFAULT_CAPTURE_NOTE,
  ROADMAP_DEFAULT_SUMMARY,
  ROADMAP_NEXT_STEPS,
  ROADMAP_NEXT_STEPS_TITLE,
  ROADMAP_PHASE_0_DESCRIPTION,
  ROADMAP_PHASE_0_HEADING,
  ROADMAP_PHASE_1_DESCRIPTION,
  ROADMAP_PHASE_1_HEADING,
  ROADMAP_PHASE_2_DESCRIPTION,
  ROADMAP_PHASE_2_HEADING,
  ROADMAP_PHASE_3_DESCRIPTION,
  ROADMAP_PHASE_3_HEADING,
  ROADMAP_PRIORITY_TABLE_HEADERS,
  ROADMAP_PRIORITY_TABLE_TITLE,
  ROADMAP_SCHEMA_VERSION,
  ROADMAP_TITLE
} from "./constants.js";
import { splitCapabilitiesByPhase } from "./prioritizer.js";
import type { RoadmapCapability, RoadmapDocument, RoadmapPhase } from "./types.js";

function formatCapabilitySummary(capability: RoadmapCapability): string {
  const density = capability.tribalKnowledgeDensity;
  const captureFirst = capability.captureFirstNote ?? ROADMAP_DEFAULT_CAPTURE_NOTE;
  const gaps = capability.primaryGaps.length > 0 ? capability.primaryGaps.join(", ") : "unspecified gaps";

  return [
    `### ${capability.capability}`,
    `**Priority score:** ${capability.priorityScore} (criticality: ${capability.businessCriticality} x density: ${density} x frequency: ${capability.agentTouchpointFrequency})`,
    `**Primary gaps:** ${gaps}`,
    `**Suggested action:** Run \`cdad init ${capability.capability}\` to scaffold the contract.`,
    `**What to capture first:** ${captureFirst}`
  ].join("\n");
}

function phaseHeading(phase: RoadmapPhase): string {
  switch (phase) {
    case 1:
      return ROADMAP_PHASE_1_HEADING;
    case 2:
      return ROADMAP_PHASE_2_HEADING;
    case 3:
      return ROADMAP_PHASE_3_HEADING;
    case 0:
      return ROADMAP_PHASE_0_HEADING;
  }
}

function phaseDescription(phase: RoadmapPhase): string {
  switch (phase) {
    case 1:
      return ROADMAP_PHASE_1_DESCRIPTION;
    case 2:
      return ROADMAP_PHASE_2_DESCRIPTION;
    case 3:
      return ROADMAP_PHASE_3_DESCRIPTION;
    case 0:
      return ROADMAP_PHASE_0_DESCRIPTION;
  }
}

function renderPhaseSection(capabilities: readonly RoadmapCapability[], phase: RoadmapPhase): string {
  if (capabilities.length === 0) {
    return "";
  }

  const sections = capabilities.map((capability) => formatCapabilitySummary(capability)).join("\n\n");

  return [phaseHeading(phase), phaseDescription(phase), "", sections].join("\n");
}

function formatPriorityTable(capabilities: readonly RoadmapCapability[]): string {
  const rows = capabilities
    .map((capability) =>
      `| ${capability.capability} | ${capability.businessCriticality} | ${capability.tribalKnowledgeDensity} | ${capability.agentTouchpointFrequency} | ${capability.priorityScore} | ${capability.phase === 0 ? "0" : capability.phase} |`
    )
    .join("\n");

  return [
    `## ${ROADMAP_PRIORITY_TABLE_TITLE}`,
    "",
    ...ROADMAP_PRIORITY_TABLE_HEADERS,
    rows
  ].join("\n");
}

function formatNextSteps(): string {
  return ROADMAP_NEXT_STEPS.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

export function buildRoadmapMarkdown(document: RoadmapDocument): string {
  const grouped = splitCapabilitiesByPhase(document.capabilities);
  const summary = document.summary.trim().length > 0 ? document.summary : ROADMAP_DEFAULT_SUMMARY;

  const sections = [
    "---",
    `generated_by: ${document.generatedBy}`,
    `generated_at: ${document.generatedAt}`,
    `source_report: ${document.sourceReport}`,
    `schema_version: ${ROADMAP_SCHEMA_VERSION}`,
    "---",
    "",
    `# ${ROADMAP_TITLE}`,
    "",
    `## ${ROADMAP_AGENT_READINESS_LABEL}: ${document.reportScore} / 10`,
    "",
    summary,
    "",
    renderPhaseSection(grouped.phase1, 1),
    renderPhaseSection(grouped.phase2, 2),
    renderPhaseSection(grouped.phase3, 3),
    renderPhaseSection(grouped.phase0, 0),
    "",
    formatPriorityTable(document.capabilities),
    "",
    `## ${ROADMAP_NEXT_STEPS_TITLE}`,
    "",
    formatNextSteps()
  ];

  return sections
    .filter((section) => section.trim().length > 0)
    .join("\n");
}

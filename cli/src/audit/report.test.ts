import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

import { createCapabilityAssessment, createQuestionnaireSummary } from "./questionnaire.js";
import {
  createCheckReport,
  renderCheckReportJson,
  renderCheckReportMarkdown,
  renderCheckTerminalSummary
} from "./report.js";
import {
  STATIC_SCAN_SIGNAL_DEFINITIONS,
  summarizeStaticScan
} from "./scanner.js";
import type { StaticScanSignal } from "./types.js";

describe("report generator", () => {
  it("renders parseable frontmatter and the expected markdown sections", async () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("payment/retry", {
        businessRules: "no",
        constraintHistory: "no",
        dependencyRationale: "partially",
        exceptionLogic: "yes"
      })
    ]);

    const staticScan = summarizeStaticScan(buildPositiveFindings());
    const report = createCheckReport({
      repo: "example/repo",
      generatedAt: "2026-04-01T12:00:00.000Z",
      staticScan,
      questionnaire
    });

    const markdown = renderCheckReportMarkdown(report);
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);

    expect(frontmatterMatch).not.toBeNull();

    const frontmatter = load(frontmatterMatch?.[1] ?? "") as Record<string, unknown>;

    expect(frontmatter.generated_by).toBe("cdad check");
    expect(frontmatter.repo).toBe("example/repo");
    expect(frontmatter.schema_version).toBe("1.0.0");
    expect(frontmatter.band).toBe("amber");
    expect(frontmatter.score).toBe(5.6);

    expect(markdown).toContain("# Agent Readiness Report");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("## Static Scan Results");
    expect(markdown).toContain("## Capability Legibility Assessment");
    expect(markdown).toContain("## Gap Inventory");
    expect(markdown).toContain("## Recommended Next Step");
    expect(markdown).toContain("Business Rules Legibility");
    expect(markdown).toContain("Constraint History Legibility");
    expect(markdown).toContain("Dependency Rationale Legibility");
    expect(markdown).toContain("Exception Logic Legibility");
  });

  it("renders a terminal summary that follows the repo-wide header format", () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("payment/retry", {
        businessRules: "no",
        constraintHistory: "no",
        dependencyRationale: "partially",
        exceptionLogic: "yes"
      })
    ]);

    const staticScan = summarizeStaticScan(buildPositiveFindings());
    const report = createCheckReport({
      repo: "example/repo",
      generatedAt: "2026-04-01T12:00:00.000Z",
      staticScan,
      questionnaire
    });

    const terminal = renderCheckTerminalSummary(report);

    expect(terminal).toContain("cdad check — Agent Readiness Report");
    expect(terminal).toContain("Next step: Run `cdad roadmap` to generate your transformation plan based on this report.");
    expect(terminal).toContain("Full report saved to: cdad-report.md");
  });

  it("renders json output with the same frontmatter-derived score data", () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("payment/retry", {
        businessRules: "yes",
        constraintHistory: "yes",
        dependencyRationale: "yes",
        exceptionLogic: "yes"
      })
    ]);

    const staticScan = summarizeStaticScan(buildPositiveFindings());
    const report = createCheckReport({
      repo: "example/repo",
      generatedAt: "2026-04-01T12:00:00.000Z",
      staticScan,
      questionnaire
    });

    const rendered = JSON.parse(renderCheckReportJson(report)) as {
      overallScore: number;
      band: string;
      gapInventory: unknown[];
    };

    expect(rendered.overallScore).toBe(10);
    expect(rendered.band).toBe("green");
    expect(rendered.gapInventory).toHaveLength(0);
  });

  it("renders the no-gap summary path when a capability is fully legible", () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("auth/session/login", {
        businessRules: "yes",
        constraintHistory: "yes",
        dependencyRationale: "yes",
        exceptionLogic: "yes"
      })
    ]);

    const staticScan = summarizeStaticScan(buildPositiveFindings());
    const report = createCheckReport({
      repo: "example/repo",
      generatedAt: "2026-04-01T12:00:00.000Z",
      staticScan,
      questionnaire
    });

    const markdown = renderCheckReportMarkdown(report);
    const terminal = renderCheckTerminalSummary(report);

    expect(markdown).toContain("**Risk:** An agent has enough legibility here to move with minimal supervision.");
    expect(terminal).toContain("The report does not show any remaining legibility gaps.");
  });

  it("sorts capability summaries, quotes complex gap inventory values, and truncates the top risk list", () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("zeta/one", {
        businessRules: "partially",
        constraintHistory: "yes",
        dependencyRationale: "yes",
        exceptionLogic: "yes"
      }),
      createCapabilityAssessment("beta/two", {
        businessRules: "no",
        constraintHistory: "yes",
        dependencyRationale: "yes",
        exceptionLogic: "yes"
      }),
      createCapabilityAssessment("alpha/three", {
        businessRules: "yes",
        constraintHistory: "no",
        dependencyRationale: "yes",
        exceptionLogic: "yes"
      }),
      createCapabilityAssessment("quoted capability", {
        businessRules: "yes",
        constraintHistory: "yes",
        dependencyRationale: "no",
        exceptionLogic: "yes"
      })
    ]);

    const staticScan = summarizeStaticScan(buildPositiveFindings());
    const report = createCheckReport({
      repo: "example/repo",
      generatedAt: "2026-04-01T12:00:00.000Z",
      staticScan,
      questionnaire
    });

    const terminal = renderCheckTerminalSummary(report);
    const markdown = renderCheckReportMarkdown(report);

    expect(report.capabilitySummaries.map((summary) => summary.capability)).toEqual([
      "alpha/three",
      "beta/two",
      "quoted capability",
      "zeta/one"
    ]);
    expect(report.capabilitySummaries.map((summary) => summary.severity)).toEqual([
      "high",
      "critical",
      "critical",
      "medium"
    ]);
    expect(terminal).toContain("  ✗ alpha/three");
    expect(terminal).toContain("  ✗ beta/two");
    expect(terminal).toContain("  ✗ quoted capability");
    expect(terminal).not.toContain("zeta/one");
    expect(markdown).toContain('  - capability: "quoted capability"');
    expect(markdown).toContain("    gap_type: dependencyRationale");
  });

  it("renders the empty capability path without a top risk entry", () => {
    const questionnaire = createQuestionnaireSummary([]);
    const staticScan = summarizeStaticScan(buildPositiveFindings());
    const report = createCheckReport({
      repo: "example/repo",
      generatedAt: "2026-04-01T12:00:00.000Z",
      staticScan,
      questionnaire
    });

    const terminal = renderCheckTerminalSummary(report);
    const markdown = renderCheckReportMarkdown(report);

    expect(report.capabilitySummaries).toHaveLength(0);
    expect(terminal).toContain("The report does not show any remaining legibility gaps.");
    expect(markdown).toContain("The report does not show any remaining legibility gaps.");
  });
});

function buildPositiveFindings(): StaticScanSignal[] {
  return STATIC_SCAN_SIGNAL_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    description: definition.description,
    kind: definition.kind,
    found: definition.kind === "positive",
    points: definition.points,
    score: definition.kind === "positive" ? definition.points : 0,
    matchedPaths: definition.kind === "positive" ? ["/tmp/example"] : []
  }));
}

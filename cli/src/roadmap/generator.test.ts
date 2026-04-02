import { describe, expect, it } from "vitest";

import { buildRoadmapMarkdown } from "./generator.js";
import type { RoadmapDocument } from "./types.js";

describe("buildRoadmapMarkdown", () => {
  it("renders the roadmap frontmatter, sections, and table", () => {
    const document: RoadmapDocument = {
      generatedBy: "cdad roadmap",
      generatedAt: "2026-04-02T00:00:00Z",
      sourceReport: "cdad-report.md",
      reportScore: 3.4,
      summary: "The repo still needs targeted extraction work before it is safe for autonomous agents.",
      capabilities: [
        {
          capability: "payment/retry",
          legibilityScore: 1,
          businessCriticality: 3,
          agentTouchpointFrequency: 1,
          primaryGaps: ["constraint history", "dependency rationale"],
          captureFirstNote: "Capture the retry constraint that prevents duplicate charges.",
          tribalKnowledgeDensity: 3,
          priorityScore: 9,
          phase: 1
        },
        {
          capability: "inventory/reserve",
          legibilityScore: 2,
          businessCriticality: 2,
          agentTouchpointFrequency: 2,
          primaryGaps: ["business rules"],
          tribalKnowledgeDensity: 2,
          priorityScore: 8,
          phase: 2
        },
        {
          capability: "docs/catalog/export",
          legibilityScore: 3.5,
          businessCriticality: 1,
          agentTouchpointFrequency: 2,
          primaryGaps: ["dependency rationale"],
          tribalKnowledgeDensity: 1,
          priorityScore: 2,
          phase: 3
        },
        {
          capability: "auth/session/login",
          legibilityScore: 4,
          businessCriticality: 3,
          agentTouchpointFrequency: 3,
          primaryGaps: ["exception logic"],
          tribalKnowledgeDensity: 0,
          priorityScore: 0,
          phase: 0
        }
      ]
    };

    const markdown = buildRoadmapMarkdown(document);

    expect(markdown).toContain("generated_by: cdad roadmap");
    expect(markdown).toContain("generated_at: 2026-04-02T00:00:00Z");
    expect(markdown).toContain("# Transformation Roadmap");
    expect(markdown).toContain("## Agent-Readiness Score: 3.4 / 10");
    expect(markdown).toContain("## Phase 1 — Immediate (Weeks 1–4)");
    expect(markdown).toContain("## Phase 2 — Near-term (Weeks 4–12)");
    expect(markdown).toContain("## Phase 3 — Ongoing");
    expect(markdown).toContain("## Not a Current Extraction Candidate");
    expect(markdown).toContain("### payment/retry");
    expect(markdown).toContain("**Priority score:** 9 (criticality: 3 x density: 3 x frequency: 1)");
    expect(markdown).toContain("## Capability Priority Table");
    expect(markdown).toContain("| payment/retry | 3 | 3 | 1 | 9 | 1 |");
    expect(markdown).toContain("| auth/session/login | 3 | 0 | 3 | 0 | 0 |");
    expect(markdown).toContain("Run `cdad init payment/retry` to scaffold the first contract");
    expect(markdown).toContain("1. Run `cdad init payment/retry` to scaffold the first contract");
    expect(markdown).toContain("2. Fill in the YAML template — focus on the fields flagged as missing above");
  });

  it("falls back to a default summary when the caller does not provide one", () => {
    const markdown = buildRoadmapMarkdown({
      generatedBy: "cdad roadmap",
      generatedAt: "2026-04-02T00:00:00Z",
      sourceReport: "cdad-report.md",
      reportScore: 0,
      summary: "   ",
      capabilities: []
    });

    expect(markdown).toContain(
      "This roadmap focuses the first extraction work on the capabilities most likely to fail under agent navigation."
    );
  });
});

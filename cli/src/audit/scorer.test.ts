import { describe, expect, it } from "vitest";

import { createCapabilityAssessment, createQuestionnaireSummary } from "./questionnaire.js";
import { determineCheckBand, computeCheckScore, computeOverallScore } from "./scorer.js";
import { STATIC_SCAN_SIGNAL_DEFINITIONS, summarizeStaticScan } from "./scanner.js";
import type { StaticScanSignal } from "./types.js";

describe("scorer domain", () => {
  it("applies the 70/30 weighting across questionnaire and static scan scores", () => {
    expect(computeOverallScore(4, 10)).toBe(10);
    expect(computeOverallScore(0, 0)).toBe(0);
    expect(computeOverallScore(2, 5)).toBe(5);
  });

  it("classifies band boundaries exactly at the spec thresholds", () => {
    expect(determineCheckBand(2.9)).toBe("red");
    expect(determineCheckBand(3.0)).toBe("amber");
    expect(determineCheckBand(5.9)).toBe("amber");
    expect(determineCheckBand(6.0)).toBe("yellow");
    expect(determineCheckBand(7.9)).toBe("yellow");
    expect(determineCheckBand(8.0)).toBe("green");
  });

  it("combines questionnaire and static scan summaries into a check score", () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("payment/retry", {
        businessRules: "no",
        constraintHistory: "no",
        dependencyRationale: "partially",
        exceptionLogic: "yes"
      })
    ]);

    const findings: StaticScanSignal[] = STATIC_SCAN_SIGNAL_DEFINITIONS.map((definition) => ({
      key: definition.key,
      label: definition.label,
      description: definition.description,
      kind: definition.kind,
      found: definition.kind === "positive",
      points: definition.points,
      score: definition.kind === "positive" ? definition.points : 0,
      matchedPaths: definition.kind === "positive" ? ["/tmp/example"] : []
    }));

    const staticScan = summarizeStaticScan(findings);
    const { overallScore, band } = computeCheckScore(questionnaire, staticScan);

    expect(overallScore).toBe(5.6);
    expect(band).toBe("amber");
  });
});

import { describe, expect, it } from "vitest";

import {
  assignRoadmapPhase,
  buildRoadmapCapabilities,
  deriveTribalKnowledgeDensity,
  multiplyAxes,
  prioritizeCapability,
  splitCapabilitiesByPhase
} from "./prioritizer.js";

describe("deriveTribalKnowledgeDensity", () => {
  it("maps a perfect legibility score to zero density", () => {
    expect(deriveTribalKnowledgeDensity(4)).toBe(0);
  });

  it("maps the phase-one boundary to density 1", () => {
    expect(deriveTribalKnowledgeDensity(3.5)).toBe(1);
  });

  it("maps the middle band to density 2", () => {
    expect(deriveTribalKnowledgeDensity(2)).toBe(2);
    expect(deriveTribalKnowledgeDensity(3.4)).toBe(2);
  });

  it("maps low legibility to density 3", () => {
    expect(deriveTribalKnowledgeDensity(0)).toBe(3);
    expect(deriveTribalKnowledgeDensity(1.9)).toBe(3);
  });

  it("rejects scores outside the supported range", () => {
    expect(() => deriveTribalKnowledgeDensity(-0.1)).toThrow(
      "Legibility score must be between 0 and 4. Received -0.1."
    );
    expect(() => deriveTribalKnowledgeDensity(4.1)).toThrow(
      "Legibility score must be between 0 and 4. Received 4.1."
    );
  });
});

describe("assignRoadmapPhase", () => {
  it("treats zero as a non-candidate", () => {
    expect(assignRoadmapPhase(0)).toBe(0);
  });

  it("maps phase-three scores into phase 3", () => {
    expect(assignRoadmapPhase(1)).toBe(3);
    expect(assignRoadmapPhase(3)).toBe(3);
  });

  it("maps the phase-two boundary range into phase 2", () => {
    expect(assignRoadmapPhase(4)).toBe(2);
    expect(assignRoadmapPhase(8)).toBe(2);
  });

  it("maps the phase-one boundary and above to phase 1", () => {
    expect(assignRoadmapPhase(9)).toBe(1);
    expect(assignRoadmapPhase(12)).toBe(1);
  });

  it("rejects invalid priority scores", () => {
    expect(() => assignRoadmapPhase(-1)).toThrow(
      "Priority score must be a finite non-negative number. Received -1."
    );
    expect(() => assignRoadmapPhase(Number.NaN)).toThrow(
      "Priority score must be a finite non-negative number. Received NaN."
    );
  });
});

describe("multiplyAxes", () => {
  it("multiplies all three axes together", () => {
    expect(multiplyAxes(3, 3, 1)).toBe(9);
  });

  it("returns zero when any axis is zero", () => {
    expect(multiplyAxes(3, 0, 3)).toBe(0);
  });

  it("does not add axes together", () => {
    expect(multiplyAxes(2, 2, 1)).not.toBe(5);
  });

  it("handles the minimum non-zero phase boundary", () => {
    expect(multiplyAxes(1, 1, 1)).toBe(1);
  });

  it("handles a representative phase-two score", () => {
    expect(multiplyAxes(2, 2, 2)).toBe(8);
  });
});

describe("prioritizeCapability", () => {
  it("builds a ranked entry from the raw prioritization inputs", () => {
    expect(
      prioritizeCapability({
        capability: "payment/retry",
        legibilityScore: 3.5,
        businessCriticality: 3,
        agentTouchpointFrequency: 1,
        primaryGaps: ["constraint history"]
      })
    ).toEqual({
      capability: "payment/retry",
      legibilityScore: 3.5,
      businessCriticality: 3,
      agentTouchpointFrequency: 1,
      primaryGaps: ["constraint history"],
      tribalKnowledgeDensity: 1,
      priorityScore: 3,
      phase: 3
    });
  });

  it("marks a fully legible capability as a non-candidate", () => {
    expect(
      prioritizeCapability({
        capability: "auth/session/login",
        legibilityScore: 4,
        businessCriticality: 3,
        agentTouchpointFrequency: 3,
        primaryGaps: []
      }).phase
    ).toBe(0);
  });
});

describe("buildRoadmapCapabilities", () => {
  it("sorts capabilities by priority score descending and name ascending on ties", () => {
    expect(
      buildRoadmapCapabilities([
        {
          capability: "inventory/reserve",
          legibilityScore: 2,
          businessCriticality: 2,
          agentTouchpointFrequency: 2,
          primaryGaps: []
        },
        {
          capability: "billing/refund",
          legibilityScore: 2,
          businessCriticality: 2,
          agentTouchpointFrequency: 2,
          primaryGaps: []
        },
        {
          capability: "payment/retry",
          legibilityScore: 3.5,
          businessCriticality: 3,
          agentTouchpointFrequency: 1,
          primaryGaps: []
        },
        {
          capability: "auth/session/login",
          legibilityScore: 3.5,
          businessCriticality: 3,
          agentTouchpointFrequency: 3,
          primaryGaps: []
        }
      ]).map((entry) => entry.capability)
    ).toEqual(["auth/session/login", "billing/refund", "inventory/reserve", "payment/retry"]);
  });
});

describe("splitCapabilitiesByPhase", () => {
  it("keeps the phase buckets deterministic", () => {
    const buckets = splitCapabilitiesByPhase(
      buildRoadmapCapabilities([
        {
          capability: "auth/session/login",
          legibilityScore: 4,
          businessCriticality: 3,
          agentTouchpointFrequency: 3,
          primaryGaps: []
        },
        {
          capability: "payment/retry",
          legibilityScore: 3.5,
          businessCriticality: 3,
          agentTouchpointFrequency: 1,
          primaryGaps: []
        },
        {
          capability: "inventory/reserve",
          legibilityScore: 2,
          businessCriticality: 2,
          agentTouchpointFrequency: 2,
          primaryGaps: []
        }
      ])
    );

    expect(buckets.phase0.map((entry) => entry.capability)).toEqual(["auth/session/login"]);
    expect(buckets.phase1).toHaveLength(0);
    expect(buckets.phase2.map((entry) => entry.capability)).toEqual(["inventory/reserve"]);
    expect(buckets.phase3.map((entry) => entry.capability)).toEqual(["payment/retry"]);
  });
});

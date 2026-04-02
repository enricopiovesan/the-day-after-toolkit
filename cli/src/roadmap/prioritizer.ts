/*
 * Prioritization logic for the extraction priority matrix.
 */

import {
  ROADMAP_PHASE_1_THRESHOLD,
  ROADMAP_PHASE_2_THRESHOLD
} from "./constants.js";
import type {
  RoadmapCapability,
  RoadmapCapabilityBuckets,
  RoadmapCapabilityInput,
  RoadmapPhase
} from "./types.js";

export function multiplyAxes(
  businessCriticality: number,
  tribalKnowledgeDensity: number,
  agentTouchpointFrequency: number
): number {
  return businessCriticality * tribalKnowledgeDensity * agentTouchpointFrequency;
}

// Spec: `cdad roadmap` derives density directly from the legibility score and treats a fully legible capability as a non-candidate.
export function deriveTribalKnowledgeDensity(legibilityScore: number): 0 | 1 | 2 | 3 {
  if (legibilityScore < 0 || legibilityScore > 4) {
    throw new RangeError(`Legibility score must be between 0 and 4. Received ${legibilityScore}.`);
  }

  if (legibilityScore >= 4) {
    return 0;
  }

  if (legibilityScore >= 3.5) {
    return 1;
  }

  if (legibilityScore >= 2) {
    return 2;
  }

  return 3;
}

// Spec: Appendix C phase assignment uses multiplication, with score 0 reserved for non-candidates and score 9+ treated as Phase 1.
export function assignRoadmapPhase(priorityScore: number): RoadmapPhase {
  if (!Number.isFinite(priorityScore) || priorityScore < 0) {
    throw new RangeError(`Priority score must be a finite non-negative number. Received ${priorityScore}.`);
  }

  if (priorityScore === 0) {
    return 0;
  }

  if (priorityScore >= ROADMAP_PHASE_1_THRESHOLD) {
    return 1;
  }

  if (priorityScore >= ROADMAP_PHASE_2_THRESHOLD) {
    return 2;
  }

  return 3;
}

export function prioritizeCapability(input: RoadmapCapabilityInput): RoadmapCapability {
  const tribalKnowledgeDensity = deriveTribalKnowledgeDensity(input.legibilityScore);
  const priorityScore = multiplyAxes(
    input.businessCriticality,
    tribalKnowledgeDensity,
    input.agentTouchpointFrequency
  );

  return {
    ...input,
    tribalKnowledgeDensity,
    priorityScore,
    phase: assignRoadmapPhase(priorityScore)
  };
}

export function rankCapabilities(capabilities: readonly RoadmapCapability[]): RoadmapCapability[] {
  return [...capabilities].sort((left, right) => {
    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }

    return left.capability.localeCompare(right.capability);
  });
}

export function buildRoadmapCapabilities(
  inputs: readonly RoadmapCapabilityInput[]
): RoadmapCapability[] {
  return rankCapabilities(inputs.map((input) => prioritizeCapability(input)));
}

export function splitCapabilitiesByPhase(
  capabilities: readonly RoadmapCapability[]
): RoadmapCapabilityBuckets {
  return {
    phase0: capabilities.filter((capability) => capability.phase === 0),
    phase1: capabilities.filter((capability) => capability.phase === 1),
    phase2: capabilities.filter((capability) => capability.phase === 2),
    phase3: capabilities.filter((capability) => capability.phase === 3)
  };
}

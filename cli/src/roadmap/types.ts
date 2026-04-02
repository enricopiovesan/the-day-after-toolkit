/*
 * Shared roadmap data shapes used by the prioritizer and roadmap generator.
 * Keeping these in one place keeps the phase logic and markdown rendering in sync.
 */

export type RoadmapPhase = 0 | 1 | 2 | 3;

export interface RoadmapCapabilityInput {
  readonly capability: string;
  readonly legibilityScore: number;
  readonly businessCriticality: 0 | 1 | 2 | 3;
  readonly agentTouchpointFrequency: 0 | 1 | 2 | 3;
  readonly primaryGaps: readonly string[];
  readonly captureFirstNote?: string;
}

export interface RoadmapCapability extends RoadmapCapabilityInput {
  readonly tribalKnowledgeDensity: 0 | 1 | 2 | 3;
  readonly priorityScore: number;
  readonly phase: RoadmapPhase;
}

export interface RoadmapCapabilityBuckets {
  readonly phase0: readonly RoadmapCapability[];
  readonly phase1: readonly RoadmapCapability[];
  readonly phase2: readonly RoadmapCapability[];
  readonly phase3: readonly RoadmapCapability[];
}

export interface RoadmapDocument {
  readonly generatedBy: string;
  readonly generatedAt: string;
  readonly sourceReport: string;
  readonly reportScore: number;
  readonly summary: string;
  readonly capabilities: readonly RoadmapCapability[];
}
